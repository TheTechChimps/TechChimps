import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";
import ts from "typescript";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const servicesPath = path.join(root, "data", "services.ts");
const stripeApiVersion = "2026-04-22.dahlia";
const expectedAccountId = "acct_1Tahe0Dwr8bO2Eod";
const requiredWebhookEvents = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  const env = readEnv(envPath);
  const secretKey = env.STRIPE_SECRET_KEY;

  if (!secretKey?.startsWith("sk_live_")) {
    throw new Error("STRIPE_SECRET_KEY must be the TechChimps live secret key.");
  }

  const siteUrl = (env.NEXT_PUBLIC_SITE_URL || "https://techchimps.com").replace(/\/$/, "");
  const stripe = new Stripe(secretKey, { apiVersion: stripeApiVersion });
  const account = await stripe.accounts.retrieve();

  if (account.id !== expectedAccountId) {
    throw new Error(`Refusing to sync: expected TechChimps ${expectedAccountId}, got ${account.id}.`);
  }

  const services = extractServices();
  const products = await syncProductsAndPrices(stripe, services, siteUrl);
  const webhook = await syncWebhook(stripe, env, siteUrl);

  if (webhook.secret) {
    env.STRIPE_WEBHOOK_SECRET = webhook.secret;
    writeEnv(envPath, env);
  }

  console.log(
    JSON.stringify(
      {
        account: {
          id: account.id,
          name: account.business_profile?.name ?? "TechChimps",
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled
        },
        products_synced: products.length,
        prices_synced: products.filter((product) => product.priceId).length,
        webhook: {
          id: webhook.id,
          url: webhook.url,
          created_new_secret: Boolean(webhook.secret)
        }
      },
      null,
      2
    )
  );
}

async function syncProductsAndPrices(stripe, services, siteUrl) {
  const existingProducts = await listAll((params) => stripe.products.list(params));
  const synced = [];

  for (const service of services) {
    const product = await upsertProduct(stripe, existingProducts, service, siteUrl);
    const price = await ensurePrice(stripe, product, service);

    if (product.default_price !== price.id) {
      await stripe.products.update(product.id, { default_price: price.id });
    }

    synced.push({
      productId: product.id,
      priceId: price.id,
      slug: service.slug
    });
  }

  return synced;
}

async function upsertProduct(stripe, existingProducts, service, siteUrl) {
  const existing = existingProducts.find(
    (product) => product.metadata?.source === "techchimps-site" && product.metadata?.slug === service.slug
  );
  const metadata = {
    app: "techchimps",
    base_price_gbp: String(service.price),
    category: service.category,
    slug: service.slug,
    source: "techchimps-site",
    subscription: service.priceSuffix ? "true" : "false"
  };
  const payload = {
    active: true,
    description: service.summary.slice(0, 500),
    metadata,
    name: `TechChimps - ${service.name}`,
    url: `${siteUrl}/services/${service.slug}`
  };

  if (existing) {
    return stripe.products.update(existing.id, payload);
  }

  const created = await stripe.products.create(payload);
  existingProducts.push(created);
  return created;
}

async function ensurePrice(stripe, product, service) {
  const unitAmount = Math.round(service.price * 100);
  const recurring = service.priceSuffix ? { interval: "month" } : undefined;
  const lookupKey = makeLookupKey(service, unitAmount);
  const existingPrices = await listAll((params) => stripe.prices.list({ ...params, product: product.id }));
  const matching = existingPrices.find(
    (price) =>
      price.active &&
      price.currency === "gbp" &&
      price.unit_amount === unitAmount &&
      Boolean(price.recurring) === Boolean(recurring) &&
      (!recurring || price.recurring?.interval === "month")
  );

  if (matching) {
    await stripe.prices.update(matching.id, {
      metadata: {
        app: "techchimps",
        service_slug: service.slug,
        source: "techchimps-site"
      },
      nickname: service.name
    });
    return matching;
  }

  return stripe.prices.create({
    currency: "gbp",
    lookup_key: lookupKey,
    metadata: {
      app: "techchimps",
      service_slug: service.slug,
      source: "techchimps-site"
    },
    nickname: service.name,
    product: product.id,
    recurring,
    unit_amount: unitAmount
  });
}

async function syncWebhook(stripe, env, siteUrl) {
  const webhookUrl = `${siteUrl}/api/stripe/webhook`;
  const endpoints = await listAll((params) => stripe.webhookEndpoints.list(params));
  const enabledForUrl = endpoints.filter((endpoint) => endpoint.url === webhookUrl && endpoint.status === "enabled");

  if (env.STRIPE_WEBHOOK_SECRET && enabledForUrl.length > 0) {
    const endpoint = enabledForUrl[0];
    await stripe.webhookEndpoints.update(endpoint.id, {
      description: "TechChimps Checkout automation",
      enabled_events: requiredWebhookEvents,
      metadata: {
        app: "techchimps",
        source: "techchimps-site"
      }
    });
    return { id: endpoint.id, url: endpoint.url, secret: "" };
  }

  for (const endpoint of enabledForUrl) {
    await stripe.webhookEndpoints.update(endpoint.id, { disabled: true });
  }

  const endpoint = await stripe.webhookEndpoints.create({
    description: "TechChimps Checkout automation",
    enabled_events: requiredWebhookEvents,
    metadata: {
      app: "techchimps",
      source: "techchimps-site"
    },
    url: webhookUrl
  });

  return {
    id: endpoint.id,
    secret: endpoint.secret || "",
    url: endpoint.url
  };
}

function extractServices() {
  const source = fs.readFileSync(servicesPath, "utf8");
  const sourceFile = ts.createSourceFile(servicesPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let servicesArray = null;

  visit(sourceFile);

  if (!servicesArray) {
    throw new Error("Could not find exported services array.");
  }

  const services = servicesArray.elements
    .filter(ts.isObjectLiteralExpression)
    .map((node) => ({
      category: readStringProperty(node, "category"),
      name: readStringProperty(node, "name"),
      price: readNumberProperty(node, "price"),
      priceSuffix: readOptionalStringProperty(node, "priceSuffix"),
      slug: readStringProperty(node, "slug"),
      summary: readStringProperty(node, "summary")
    }))
    .filter((service) => service.slug !== "custom-request" && service.price > 0);

  const invalid = services.filter((service) => !service.slug || !service.name || !service.category || service.price <= 0);
  if (invalid.length > 0) {
    throw new Error(`Could not parse all services: ${invalid.map((service) => service.slug || service.name).join(", ")}`);
  }

  return services;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "services" &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      servicesArray = node.initializer;
      return;
    }

    ts.forEachChild(node, visit);
  }
}

function readStringProperty(node, name) {
  const value = readOptionalStringProperty(node, name);
  if (!value) throw new Error(`Missing string property ${name}.`);
  return value;
}

function readOptionalStringProperty(node, name) {
  const expression = findProperty(node, name)?.initializer;
  if (!expression) return "";
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return expression.text;
  return "";
}

function readNumberProperty(node, name) {
  const expression = findProperty(node, name)?.initializer;
  if (!expression) return 0;
  if (ts.isNumericLiteral(expression)) return Number(expression.text);
  return 0;
}

function findProperty(node, name) {
  return node.properties.find((property) => {
    if (!ts.isPropertyAssignment(property)) return false;
    const propertyName = property.name;
    return (
      (ts.isIdentifier(propertyName) && propertyName.text === name) ||
      (ts.isStringLiteral(propertyName) && propertyName.text === name)
    );
  });
}

async function listAll(fetchPage) {
  const items = [];
  let startingAfter;

  do {
    const page = await fetchPage({ limit: 100, starting_after: startingAfter });
    items.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);

  return items;
}

function makeLookupKey(service, unitAmount) {
  const slug = service.slug.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
  const cadence = service.priceSuffix ? "monthly" : "one_time";
  return `techchimps_${slug}_${cadence}_${unitAmount}_gbp`;
}

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }

  return env;
}

function writeEnv(file, env) {
  const existingKeys = fs.existsSync(file)
    ? fs
        .readFileSync(file, "utf8")
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1])
        .filter(Boolean)
    : [];
  const preferredKeys = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_CONTACT_EMAIL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "QUOTE_WEBHOOK_URL",
    "STUDIO_NOTIFICATION_WEBHOOK_URL",
    "CRM_API_URL",
    "EMAIL_AUTOMATION_WEBHOOK_URL",
    "BLOB_READ_WRITE_TOKEN",
    "VERCEL_DEPLOY_HOOK_URL",
    "VERCEL_TOKEN",
    "VERCEL_SCOPE",
    "EMAIL_FROM",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET"
  ];
  const keys = [...new Set([...preferredKeys, ...existingKeys, ...Object.keys(env)])].filter(
    (key) => env[key] !== undefined && env[key] !== ""
  );

  fs.writeFileSync(file, `${keys.map((key) => `${key}=${env[key]}`).join("\n")}\n`);
}
