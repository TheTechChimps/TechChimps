"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileUp,
  HandCoins,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageCircle,
  Palette,
  Sparkles
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { createCheckoutSession, submitQuoteRequest, uploadProjectFiles } from "@/lib/api";
import { applyDiscount, normalizeDiscountCode } from "@/lib/discount-codes";
import { clamp, formatPrice } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { serviceCategories, services, type Service, type ServiceCategory } from "@/data/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { liveSupportEtaMessage, liveSupportHandoffMessage } from "@/lib/support-copy";

type BuilderState = {
  attachmentNames: string[];
  serviceType: string;
  budget: string;
  timeline: string;
  deliverySpeed: string;
  completionDate: string;
  goals: string;
  creativeControl: boolean;
  serviceAnswers: Record<string, string>;
  contactName: string;
  contactEmail: string;
  discountCode: string;
  offerMode: "standard" | "custom" | "discount";
  offerAmount: string;
  offerReason: string;
};

const initialState: BuilderState = {
  attachmentNames: [],
  serviceType: "standard-website",
  budget: "149-299",
  timeline: "this-month",
  deliverySpeed: "standard",
  completionDate: "",
  goals: "",
  creativeControl: false,
  serviceAnswers: {},
  contactName: "",
  contactEmail: "",
  discountCode: "",
  offerMode: "standard",
  offerAmount: "",
  offerReason: ""
};

const timelineLabels: Record<string, string> = {
  "one-day": "1 day",
  "two-day": "2 days",
  "three-day": "3 days",
  "this-week": "this week",
  "this-month": "this month",
  flexible: "flexible"
};

const timelineMultipliers: Record<string, number> = {
  "one-day": 1.6,
  "two-day": 1.45,
  "three-day": 1.3,
  "this-week": 1.15,
  "this-month": 1,
  flexible: 0.95
};

const deliveryLabels: Record<string, string> = {
  standard: "standard delivery",
  priority: "priority delivery",
  express: "fast-track delivery",
  rush50: "50% faster ETA"
};

const deliveryMultipliers: Record<string, number> = {
  standard: 1,
  priority: 1.2,
  express: 1.35,
  rush50: 1.5
};

type IntakeStepId = "service" | "brief" | "timing" | "finish";

const intakeSteps: { description: string; id: IntakeStepId; label: string }[] = [
  { id: "service", label: "Choose", description: "Service and idea" },
  { id: "brief", label: "Guide", description: "Smart questions" },
  { id: "timing", label: "Plan", description: "Budget and timing" },
  { id: "finish", label: "Start", description: "Contact and checkout" }
];

type ServiceQuestion = {
  id: string;
  label: string;
  prompt: string;
  placeholder: string;
  required?: boolean;
  rows?: number;
};

const commonQuestions: ServiceQuestion[] = [
  {
    id: "working-title",
    label: "Name or working title",
    prompt: "What should we call this project?",
    placeholder: "Example: Wade's Cleaning website, DJ booking page, Support bot..."
  },
  {
    id: "audience",
    label: "Who is it for?",
    prompt: "Tell us who will use it or visit it.",
    placeholder: "Example: local homeowners, Discord members, staff, customers on mobile..."
  }
];

const categoryQuestions: Record<ServiceCategory, ServiceQuestion[]> = {
  "Quick Launch": [
    {
      id: "main-offer",
      label: "Main offer or action",
      prompt: "What is the one thing people should do?",
      placeholder: "Book, buy, message, follow, join, download, leave details..."
    },
    {
      id: "links-content",
      label: "Links and content",
      prompt: "What links, sections, text, products, prices, or media must be included?",
      placeholder: "Paste links, bullet points, offers, socials, payment links, booking links...",
      rows: 4
    },
    {
      id: "visual-style",
      label: "Look and feel",
      prompt: "What style should it have?",
      placeholder: "Clean and premium, bright and playful, dark and sleek, luxury, fitness, music..."
    },
    {
      id: "success",
      label: "Success goal",
      prompt: "How will you know this worked?",
      placeholder: "More bookings, more DMs, clearer offer, better first impression..."
    }
  ],
  Websites: [
    {
      id: "pages-sections",
      label: "Pages or sections",
      prompt: "What pages or sections do you need?",
      placeholder: "Home, services, prices, about, gallery, FAQs, contact, booking...",
      rows: 4
    },
    {
      id: "services-prices",
      label: "Services and prices",
      prompt: "What do you sell or offer, and what should customers know?",
      placeholder: "List services, packages, prices, locations, process, guarantees...",
      rows: 4
    },
    {
      id: "trust-proof",
      label: "Trust proof",
      prompt: "What makes people trust you?",
      placeholder: "Reviews, years open, photos, qualifications, before/after, guarantees..."
    },
    {
      id: "contact-action",
      label: "Best next step",
      prompt: "How should customers contact you or take action?",
      placeholder: "Call, WhatsApp, email, form, booking link, Stripe link..."
    },
    {
      id: "local-seo",
      label: "Location and search words",
      prompt: "Where do you serve and what should people search to find you?",
      placeholder: "Example: web design Birmingham, cleaner in Leeds, Discord bot UK..."
    }
  ],
  "Web Apps": [
    {
      id: "main-workflow",
      label: "Main workflow",
      prompt: "What should the app let users do from start to finish?",
      placeholder: "Customer enters X, app calculates Y, admin reviews Z...",
      rows: 4
    },
    {
      id: "user-roles",
      label: "Users and roles",
      prompt: "Who uses it, and what can each person do?",
      placeholder: "Customer, admin, staff, manager, public visitor..."
    },
    {
      id: "data-fields",
      label: "Data to collect or save",
      prompt: "What information should the app store, show, calculate, or export?",
      placeholder: "Names, prices, dates, statuses, files, messages, orders...",
      rows: 4
    },
    {
      id: "screens",
      label: "Screens and dashboard",
      prompt: "What screens should exist?",
      placeholder: "Login, dashboard, form, results, admin panel, settings..."
    },
    {
      id: "integrations",
      label: "Integrations",
      prompt: "Does it need payments, email, Discord, APIs, uploads, or automations?",
      placeholder: "Stripe, webhook, email inbox, Google Sheets, Discord, CRM..."
    }
  ],
  "Windows Apps": [
    {
      id: "manual-process",
      label: "Current manual job",
      prompt: "What repetitive job should the desktop tool replace?",
      placeholder: "Explain the current steps you do by hand.",
      rows: 4
    },
    {
      id: "inputs",
      label: "Inputs",
      prompt: "What files, folders, text, settings, or data does the tool need?",
      placeholder: "CSV, images, PDFs, folder paths, names, prices, account lists..."
    },
    {
      id: "outputs",
      label: "Outputs",
      prompt: "What should the tool create or change?",
      placeholder: "Renamed files, reports, cleaned data, generated documents, alerts..."
    },
    {
      id: "controls",
      label: "Buttons and controls",
      prompt: "What buttons, options, warnings, or settings should it have?",
      placeholder: "Start, pause, choose folder, export, preview, undo, log..."
    },
    {
      id: "environment",
      label: "PC setup",
      prompt: "What Windows version or software does it need to work with?",
      placeholder: "Windows 10/11, Excel, Chrome, local files, printer, shared drive..."
    }
  ],
  Discord: [
    {
      id: "server-purpose",
      label: "Server purpose",
      prompt: "What is your Discord server for?",
      placeholder: "Gaming, support, community, paid group, business, music..."
    },
    {
      id: "commands",
      label: "Commands and features",
      prompt: "What should the bot do?",
      placeholder: "/help, tickets, welcome, reminders, roles, logs, moderation...",
      rows: 4
    },
    {
      id: "roles-permissions",
      label: "Roles and permissions",
      prompt: "Who can use each feature?",
      placeholder: "Admins only, mods, members, subscribers, customers..."
    },
    {
      id: "channels",
      label: "Channels and messages",
      prompt: "Where should the bot post and what should it say?",
      placeholder: "Welcome channel, ticket channel, logs, announcements, support..."
    },
    {
      id: "external-links",
      label: "External links or APIs",
      prompt: "Should the bot connect to anything outside Discord?",
      placeholder: "Website, Stripe, Google Sheets, webhooks, game stats, CRM..."
    }
  ],
  Care: [
    {
      id: "live-url",
      label: "Current website/app link",
      prompt: "What should we review or maintain?",
      placeholder: "Paste the website, app, Discord, repo, or dashboard link."
    },
    {
      id: "issues",
      label: "Problems or worries",
      prompt: "What feels broken, outdated, slow, confusing, or risky?",
      placeholder: "Slow mobile, old prices, broken form, security worry, SEO issue...",
      rows: 4
    },
    {
      id: "updates",
      label: "Updates needed",
      prompt: "What content, pages, products, or settings need changing?",
      placeholder: "New photos, new prices, service edits, contact changes..."
    },
    {
      id: "access",
      label: "Access and platform",
      prompt: "What platform is it on and what access can you provide after payment?",
      placeholder: "Vercel, Netlify, WordPress, Shopify, GitHub, Discord admin..."
    },
    {
      id: "priority",
      label: "Highest priority",
      prompt: "What should we fix first if time is tight?",
      placeholder: "Checkout, contact form, mobile layout, broken link, urgent text update..."
    }
  ]
};

const extraQuestion: ServiceQuestion = {
  id: "avoid-extra",
  label: "Anything to avoid or copy from?",
  prompt: "Share examples, competitors, references, or things you do not want.",
  placeholder: "Links you like, colours, examples, no-go styles, features to avoid...",
  required: false,
  rows: 3
};

function getServiceQuestions(service: Service) {
  return [...commonQuestions, ...categoryQuestions[service.category], extraQuestion];
}

function answerKey(serviceSlug: string, questionId: string) {
  return `${serviceSlug}.${questionId}`;
}

export function RequestBuilder() {
  const [form, setForm] = useLocalStorage<BuilderState>("techchimps-request", initialState);
  const [uploadBatchId] = useState(() => crypto.randomUUID());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "redirecting" | "sent" | "error">("idle");
  const [reference, setReference] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<IntakeStepId>("service");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [handoffSessionId, setHandoffSessionId] = useState("");

  const selectedService = services.find((service) => service.slug === form.serviceType) ?? services[1];
  const visibleIntakeSteps = form.creativeControl ? intakeSteps.filter((step) => step.id !== "brief") : intakeSteps;
  const selectedQuestions = useMemo(() => getServiceQuestions(selectedService), [selectedService]);
  const currentQuestionIndex = Math.min(activeQuestionIndex, selectedQuestions.length - 1);
  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const selectedDeliverySpeed = form.deliverySpeed || "standard";
  const isOffer = form.offerMode !== "standard";
  const offeredAmount = Number.parseFloat(form.offerAmount);
  const getServiceAnswer = (question: ServiceQuestion) => form.serviceAnswers[answerKey(selectedService.slug, question.id)] ?? "";
  const currentQuestionAnswer = currentQuestion ? getServiceAnswer(currentQuestion).trim() : "";
  const structuredAnswers = useMemo(
    () =>
      selectedQuestions
        .map((question) => ({
          answer: (form.serviceAnswers[answerKey(selectedService.slug, question.id)] ?? "").trim(),
          id: question.id,
          label: question.label,
          prompt: question.prompt
        }))
        .filter((item) => item.answer.length > 0),
    [form.serviceAnswers, selectedQuestions, selectedService.slug]
  );
  const estimate = useMemo(() => {
    if (selectedService.priceSuffix) return selectedService.price;
    const timelineMultiplier = timelineMultipliers[form.timeline] ?? 1;
    const deliveryMultiplier = deliveryMultipliers[selectedDeliverySpeed] ?? 1;
    const detailLength = form.goals.length + structuredAnswers.reduce((total, answer) => total + answer.answer.length, 0);
    const customComplexity = detailLength > 650 ? 90 : detailLength > 360 ? 55 : detailLength > 180 ? 25 : 0;
    return Math.round((selectedService.price * timelineMultiplier * deliveryMultiplier + customComplexity) / 5) * 5;
  }, [
    form.goals.length,
    form.timeline,
    selectedDeliverySpeed,
    selectedService.price,
    selectedService.priceSuffix,
    structuredAnswers
  ]);
  const discountPreview = useMemo(() => applyDiscount(estimate, form.discountCode), [estimate, form.discountCode]);
  const hasDiscountCode = form.discountCode.trim().length > 0;

  const requiredQuestionAnswers = form.creativeControl
    ? []
    : selectedQuestions
        .filter((question) => question.required !== false)
        .map((question) => (getServiceAnswer(question).trim().length > 0 ? question.id : ""));
  const requiredQuestionCount = selectedQuestions.filter((question) => question.required !== false).length;
  const answeredRequiredQuestionCount = requiredQuestionAnswers.filter(Boolean).length;
  const answeredQuestionCount = selectedQuestions.filter((question) => getServiceAnswer(question).trim().length > 0).length;

  const requiredFields = [
    form.serviceType,
    form.budget,
    form.timeline,
    selectedDeliverySpeed,
    form.creativeControl || form.goals.trim() ? "brief-style" : "",
    ...requiredQuestionAnswers,
    form.contactName.trim(),
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail) ? form.contactEmail : "",
    !isOffer || (Number.isFinite(offeredAmount) && offeredAmount > 0) ? "offer-amount" : ""
  ];
  const progress = clamp(Math.round((requiredFields.filter(Boolean).length / requiredFields.length) * 100), 0, 100);
  const canSubmit = progress >= 100;
  const activeStepIndex = Math.max(0, visibleIntakeSteps.findIndex((step) => step.id === activeStep));
  const serviceStepReady = form.creativeControl || form.goals.trim().length > 0;
  const briefStepReady = form.creativeControl || answeredRequiredQuestionCount >= requiredQuestionCount;
  const timingStepReady = Boolean(form.budget && form.timeline && selectedDeliverySpeed);
  const contactStepReady =
    form.contactName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail) &&
    (!isOffer || (Number.isFinite(offeredAmount) && offeredAmount > 0));
  const currentQuestionReady = !currentQuestion || currentQuestion.required === false || currentQuestionAnswer.length > 0;
  const finishHelp =
    form.contactName.trim().length === 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)
      ? "Add your name and email, then we can open checkout or review your offer."
      : isOffer && (!Number.isFinite(offeredAmount) || offeredAmount <= 0)
        ? "Add the amount you would like to offer so we can review it fairly."
        : !isOffer && hasDiscountCode && !discountPreview.code
          ? "That discount code is not recognised yet, but you can still continue at the normal price."
          : `${liveSupportHandoffMessage} ${liveSupportEtaMessage}`;
  const canContinue =
    activeStep === "service"
      ? serviceStepReady
      : activeStep === "brief"
        ? currentQuestionIndex === selectedQuestions.length - 1
          ? briefStepReady
          : currentQuestionReady
        : activeStep === "timing"
          ? timingStepReady
          : contactStepReady;
  const isStepComplete = (stepId: IntakeStepId) =>
    stepId === "service"
      ? serviceStepReady
      : stepId === "brief"
        ? briefStepReady
        : stepId === "timing"
          ? timingStepReady
          : contactStepReady;

  const update = <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => {
    setStatus("idle");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setCreativeControl = (value: boolean) => {
    setStatus("idle");
    setForm((current) => ({ ...current, creativeControl: value }));
    setActiveQuestionIndex(0);
    if (value && activeStep === "brief") {
      setActiveStep("timing");
    }
  };

  const updateServiceAnswer = (question: ServiceQuestion, value: string) => {
    setStatus("idle");
    setForm((current) => ({
      ...current,
      serviceAnswers: {
        ...current.serviceAnswers,
        [answerKey(selectedService.slug, question.id)]: value
      }
    }));
  };

  const updateFiles = (files: FileList | null) => {
    const nextFiles = Array.from(files ?? []).slice(0, 5);
    setSelectedFiles(nextFiles);
    setForm((current) => ({
      ...current,
      attachmentNames: nextFiles.map((file) => file.name)
    }));
  };

  const goBack = () => {
    if (activeStep === "brief" && currentQuestionIndex > 0) {
      setActiveQuestionIndex((index) => Math.max(0, index - 1));
      return;
    }

    setActiveStep(visibleIntakeSteps[Math.max(0, activeStepIndex - 1)].id);
  };

  const goNext = () => {
    if (!canContinue) return;

    if (activeStep === "brief" && currentQuestionIndex < selectedQuestions.length - 1) {
      setActiveQuestionIndex((index) => Math.min(selectedQuestions.length - 1, index + 1));
      return;
    }

    setActiveStep(visibleIntakeSteps[Math.min(visibleIntakeSteps.length - 1, activeStepIndex + 1)].id);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus("saving");
    const uploadResult = await uploadProjectFiles(uploadBatchId, selectedFiles);

    if (!uploadResult.ok) {
      setStatus("error");
      setModalMessage(uploadResult.error ?? "Files could not be uploaded. Please try again.");
      setModalOpen(true);
      return;
    }

    const creativeGoals =
      "Creative control selected: the customer wants TechChimps to shape the design, layout, wording, and build direction from the selected service, timing, budget, uploaded examples, and any short notes.";
    const payload = {
      ...form,
      attachmentNames: form.attachmentNames,
      creativeControl: form.creativeControl,
      deliverySpeed: selectedDeliverySpeed,
      discountCode: isOffer ? "" : normalizeDiscountCode(form.discountCode),
      estimate,
      goals: form.creativeControl && !form.goals.trim() ? creativeGoals : form.goals,
      serviceAnswers: form.creativeControl
        ? [
            ...structuredAnswers,
            {
              answer: creativeGoals,
              id: "creative-control",
              label: "Creative control",
              prompt: "Customer chose to skip the detailed brief"
            }
          ]
        : structuredAnswers,
      uploadBatchId,
      uploadedFiles: uploadResult.data ?? []
    };
    const result = isOffer ? await submitQuoteRequest(payload) : await createCheckoutSession(payload);

    if (result.ok && result.data) {
      setReference(result.data.reference);
      setHandoffSessionId(result.data.chatSessionId);
      if (!isOffer && "url" in result.data && result.data.url) {
        setStatus("redirecting");
        window.location.assign(result.data.url);
        return;
      }

      setStatus("sent");
      if (isOffer) {
        setModalOpen(false);
      } else {
        setModalMessage(
          "Checkout is ready, but Stripe did not return a redirect URL. Your support thread is still being prepared so we can help you finish the order."
        );
        setModalOpen(true);
      }
    } else {
      setStatus("error");
      setReference(result.data?.reference ?? "");
      const setupRequired = Boolean(result.data && "setupRequired" in result.data && result.data.setupRequired);
      setModalMessage(
        setupRequired
          ? "Secure checkout is being prepared. Please message support and we will help you finish the order gently from here."
          : result.error ?? "Something stopped the request saving. Please try again."
      );
      setModalOpen(true);
    }
  };

  return (
    <section className="section request-band" id="request">
      <div className="container split request-layout">
        <div>
          <span className="eyebrow">Guided build brief</span>
          <h2 className="title">Tell us the dream product.</h2>
          <p className="subtitle">Choose a service, answer smart questions or give us creative control, then pay or make an offer.</p>

          <Card className="recommendation-card">
            <div>
              <StatusIndicator label="Smart recommendation" tone="active" />
              <h3>{selectedService.name}</h3>
              <p>
                For a {timelineLabels[form.timeline]} request with {deliveryLabels[selectedDeliverySpeed]}, a realistic
                starting estimate is{" "}
                <strong>{formatPrice(estimate)}</strong>.
              </p>
              {isOffer && Number.isFinite(offeredAmount) && offeredAmount > 0 ? (
                <p>
                  Your proposed offer is <strong>{formatPrice(offeredAmount)}</strong>. It will be reviewed before a payment link is issued.
                </p>
              ) : null}
              {!isOffer && discountPreview.code ? (
                <p>
                  Discount <strong>{discountPreview.code}</strong> applied. Checkout total:{" "}
                  <strong>{formatPrice(discountPreview.amount)}</strong>.
                </p>
              ) : null}
              {form.completionDate ? (
                <p>Preferred completion date: {new Date(form.completionDate).toLocaleDateString("en-GB")}.</p>
              ) : null}
            </div>
            <ul>
              {selectedService.outcomes.map((outcome) => (
                <li key={outcome}>
                  <CheckCircle2 aria-hidden size={17} />
                  {outcome}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="request-card">
          <div className="request-top">
            <div>
              <span className="eyebrow">
                <Sparkles size={15} /> Guided intake
              </span>
              <h3>Build brief</h3>
            </div>
            <span className="autosave">Autosaved</span>
          </div>
          <div aria-label={`${progress}% complete`} className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>

          <form className="request-form guided-request-form" onSubmit={onSubmit}>
            <nav aria-label="Request steps" className="intake-steps">
              {visibleIntakeSteps.map((step, index) => {
                const complete = isStepComplete(step.id);
                return (
                  <button
                    aria-current={activeStep === step.id ? "step" : undefined}
                    className={`intake-step ${activeStep === step.id ? "active" : ""} ${complete ? "complete" : ""}`}
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    type="button"
                  >
                    <span>{complete ? <CheckCircle2 aria-hidden size={16} /> : index + 1}</span>
                    <strong>{step.label}</strong>
                    <small>{step.description}</small>
                  </button>
                );
              })}
            </nav>

            <div className="guided-stage">
              {activeStep === "service" ? (
                <div className="guided-panel">
                  <div className="guided-panel-head">
                    <span className="eyebrow">
                      <Sparkles size={15} /> Start simple
                    </span>
                    <h4>What are we building?</h4>
                    <p>Choose the closest service and describe the idea in plain English. No technical words needed.</p>
                  </div>
            <label className="field">
              <span className="label">Choose your service</span>
              <select
                aria-label="Choose your service"
                className="select"
                onChange={(event) => {
                  update("serviceType", event.target.value);
                  setActiveQuestionIndex(0);
                }}
                value={form.serviceType}
              >
                {serviceCategories.map((category) => (
                  <optgroup key={category} label={category}>
                    {services
                      .filter((service) => service.category === category)
                      .map((service) => (
                        <option key={service.slug} value={service.slug}>
                          {service.name} - from {formatPrice(service.price, service.priceSuffix)}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <div className="brief-mode-options" aria-label="Brief style">
              <button
                aria-pressed={!form.creativeControl}
                className={!form.creativeControl ? "brief-mode-option active" : "brief-mode-option"}
                onClick={() => setCreativeControl(false)}
                type="button"
              >
                <ListChecks aria-hidden size={18} />
                <span>
                  Guide me
                  <small>Answer smart questions so we follow your exact ideas.</small>
                </span>
              </button>
              <button
                aria-pressed={form.creativeControl}
                className={form.creativeControl ? "brief-mode-option active" : "brief-mode-option"}
                onClick={() => setCreativeControl(true)}
                type="button"
              >
                <Palette aria-hidden size={18} />
                <span>
                  Creative control
                  <small>Skip the full brief and let TechChimps design the direction.</small>
                </span>
              </button>
            </div>

            <label className="field">
              <span className="label">
                {form.creativeControl ? "Optional note" : "Short project summary"}
                {form.creativeControl ? <small>Optional</small> : null}
              </span>
              <textarea
                aria-label="Short project summary"
                className="textarea"
                onChange={(event) => update("goals", event.target.value)}
                placeholder={
                  form.creativeControl
                    ? "Optional: tell us anything we should definitely know. You can leave this blank."
                    : "Example: I need a simple website for my cleaning business with prices, photos, and a contact form."
                }
                value={form.goals}
              />
              <span className="helper">
                {form.creativeControl
                  ? "We will use full creative control and only ask for budget, timing, contact, and payment or offer details."
                  : serviceStepReady
                    ? "Perfect. Next we will ask only the questions that fit this service."
                    : "One clear sentence is enough to begin."}
              </span>
            </label>
                </div>
              ) : null}

              {activeStep === "brief" && currentQuestion ? (
                <fieldset className="guided-panel guided-question-panel">
                  <legend>Smart brief for {selectedService.name}</legend>
                  <div className="question-focus">
                    <div className="question-focus-top">
                      <span>
                        Question {currentQuestionIndex + 1} of {selectedQuestions.length}
                      </span>
                      <strong>
                        {answeredQuestionCount}/{selectedQuestions.length} answered
                      </strong>
                    </div>
                    <label className="field service-question">
                      <span className="label">
                        {currentQuestion.label}
                        {currentQuestion.required === false ? <small>Optional</small> : null}
                      </span>
                      <span className="helper">{currentQuestion.prompt}</span>
                      <textarea
                        aria-label={currentQuestion.label}
                        className="textarea service-answer focused-answer"
                        onChange={(event) => updateServiceAnswer(currentQuestion, event.target.value)}
                        placeholder={currentQuestion.placeholder}
                        rows={currentQuestion.rows ?? 4}
                        value={getServiceAnswer(currentQuestion)}
                      />
                    </label>
                  </div>
                  <div className="question-map" aria-label="Smart question shortcuts">
                    {selectedQuestions.map((question, index) => {
                      const answered = getServiceAnswer(question).trim().length > 0;
                      return (
                        <button
                          aria-label={`Go to question ${index + 1}: ${question.label}${answered ? ", answered" : ""}`}
                          className={`${index === currentQuestionIndex ? "active" : ""} ${answered ? "answered" : ""}`}
                          key={question.id}
                          onClick={() => setActiveQuestionIndex(index)}
                          type="button"
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                  <p className="guided-note">
                    Each answer is saved into your build brief, so the final prompt is detailed without making this feel like a long form.
                  </p>
                </fieldset>
              ) : null}

              {activeStep === "timing" ? (
                <div className="guided-panel">
                  <div className="guided-panel-head">
                    <span className="eyebrow">
                      <Sparkles size={15} /> Plan the build
                    </span>
                    <h4>Budget and delivery timing.</h4>
                    <p>Choose how fast you want it and when you would like it finished.</p>
                  </div>

            <div className="form-grid">
              <label className="field">
                <span className="label">Budget comfort</span>
                <select
                  aria-label="Budget comfort"
                  className="select"
                  onChange={(event) => update("budget", event.target.value)}
                  value={form.budget}
                >
                  <option value="under-149">Under {formatPrice(149)}</option>
                  <option value="149-299">
                    {formatPrice(149)}-{formatPrice(299)}
                  </option>
                  <option value="300-plus">{formatPrice(300)}+</option>
                  <option value="not-sure">Not sure yet</option>
                </select>
              </label>

              <label className="field">
                <span className="label">Timeline</span>
                <select
                  className="select"
                  aria-label="Timeline"
                  onChange={(event) => update("timeline", event.target.value)}
                  value={form.timeline}
                >
                  <option value="one-day">1 day (+60%)</option>
                  <option value="two-day">2 days (+45%)</option>
                  <option value="three-day">3 days (+30%)</option>
                  <option value="this-week">This week (+15%)</option>
                  <option value="this-month">This month</option>
                  <option value="flexible">Flexible</option>
                </select>
                <span className="helper">Choose how soon you want it. Urgent builds are priced higher so they can be prioritised properly.</span>
              </label>
            </div>

            <div className="form-grid">
              <label className="field">
                <span className="label">Delivery speed</span>
                <select
                  aria-label="Delivery speed"
                  className="select"
                  onChange={(event) => update("deliverySpeed", event.target.value)}
                  value={selectedDeliverySpeed}
                >
                  <option value="standard">Standard delivery</option>
                  <option value="priority">Priority delivery (+20%)</option>
                  <option value="express">Fast-track delivery (+35%)</option>
                  <option value="rush50">50% faster ETA (+50%)</option>
                </select>
                <span className="helper">Faster delivery is an optional paid add-on.</span>
              </label>

              <label className="field">
                <span className="label">Preferred completion date</span>
                <input
                  aria-label="Preferred completion date"
                  className="input"
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => update("completionDate", event.target.value)}
                  type="date"
                  value={form.completionDate}
                />
                <span className="helper">Optional. Pick a date if you have one; we confirm timing before work starts.</span>
              </label>
            </div>
                </div>
              ) : null}

              {activeStep === "finish" ? (
                <div className="guided-panel">
                  <div className="guided-panel-head">
                    <span className="eyebrow">
                      <MessageCircle size={15} /> Start together
                    </span>
                    <h4>How should we contact you?</h4>
                    <p>After checkout or offer review, we connect you to live support so you are not left guessing.</p>
                  </div>

            <fieldset className="offer-panel">
              <legend>Checkout or offer</legend>
              <div className="offer-options" aria-label="Checkout or offer type">
                <button
                  aria-pressed={form.offerMode === "standard"}
                  className={form.offerMode === "standard" ? "offer-option active" : "offer-option"}
                  onClick={() => update("offerMode", "standard")}
                  type="button"
                >
                  <CreditCard aria-hidden size={18} />
                  <span>
                    Pay securely
                    <small>Go straight to Stripe Checkout</small>
                  </span>
                </button>
                <button
                  aria-pressed={form.offerMode !== "standard"}
                  className={form.offerMode !== "standard" ? "offer-option active" : "offer-option"}
                  onClick={() => update("offerMode", "custom")}
                  type="button"
                >
                  <HandCoins aria-hidden size={18} />
                  <span>
                    Make an offer
                    <small>Custom or discounted request</small>
                  </span>
                </button>
              </div>

              {isOffer ? (
                <>
                  <div className="form-grid">
                    <label className="field">
                      <span className="label">Offer type</span>
                      <select
                        aria-label="Offer type"
                        className="select"
                        onChange={(event) => update("offerMode", event.target.value as BuilderState["offerMode"])}
                        value={form.offerMode}
                      >
                        <option value="custom">Custom offer</option>
                        <option value="discount">Discounted offer</option>
                      </select>
                      <span className="helper">Custom scope or a lower price request.</span>
                    </label>
                    <label className="field">
                      <span className="label">Offer amount</span>
                      <input
                        aria-label="Offer amount"
                        className="input"
                        min="1"
                        onChange={(event) => update("offerAmount", event.target.value)}
                        placeholder="Example: 120"
                        type="number"
                        value={form.offerAmount}
                      />
                      <span className="helper">Offers are reviewed before payment is requested.</span>
                    </label>
                  </div>
                  <label className="field">
                    <span className="label">Offer reason <small>Optional</small></span>
                    <input
                      aria-label="Offer reason"
                      className="input"
                      onChange={(event) => update("offerReason", event.target.value)}
                      placeholder="Budget, repeat work, charity, simple scope..."
                      value={form.offerReason}
                    />
                    <span className="helper">Optional, but it helps us review your offer faster.</span>
                  </label>
                </>
              ) : null}
            </fieldset>

            {!isOffer ? (
              <div className="discount-panel">
                <label className="field">
                  <span className="label">Discount code <small>Optional</small></span>
                  <input
                    aria-label="Discount code"
                    autoCapitalize="characters"
                    className="input"
                    onChange={(event) => update("discountCode", normalizeDiscountCode(event.target.value))}
                    placeholder="Enter your code before checkout"
                    value={form.discountCode}
                  />
                  <span className="helper">Add a customer code here before we send you to Stripe Checkout.</span>
                </label>
                {hasDiscountCode ? (
                  <p className={discountPreview.code ? "discount-note success" : "discount-note warning"}>
                    {discountPreview.code
                      ? `${discountPreview.code} applied: ${discountPreview.percentOff}% off. New checkout total ${formatPrice(
                          discountPreview.amount
                        )}.`
                      : "Code not recognised. You can still continue at the normal price, or check the code and try again."}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="form-grid">
              <label className="field">
                <span className="label">Name</span>
                <input
                  aria-label="Name"
                  className="input"
                  onChange={(event) => update("contactName", event.target.value)}
                  value={form.contactName}
                />
              </label>

              <label className="field">
                <span className="label">Email</span>
                <input
                  aria-label="Email"
                  className="input"
                  onChange={(event) => update("contactEmail", event.target.value)}
                  type="email"
                  value={form.contactEmail}
                />
              </label>
            </div>

            <label className="upload-box">
              <FileUp aria-hidden size={20} />
              <span>
                Upload examples or notes
                <small>{form.attachmentNames.length ? form.attachmentNames.join(", ") : "Up to 5 files, 8MB each."}</small>
              </span>
              <input aria-label="Upload project examples" multiple onChange={(event) => updateFiles(event.target.files)} type="file" />
            </label>

                  <p aria-live="polite" className="finish-help">
                    {finishHelp}
                  </p>

                  <div className="handoff-note">
                    <Lightbulb aria-hidden size={20} />
                    <p>
                      {liveSupportHandoffMessage} {liveSupportEtaMessage} Ask anything, send extra details, or tell us if
                      something feels wrong. You should never be scared to reach out for help or let us know if you are unhappy with something.
                    </p>
                  </div>

            {status === "error" ? <p className="form-error">Something stopped the request saving. Please try again.</p> : null}
                </div>
              ) : null}
            </div>

            <div className="intake-actions">
              <Button disabled={activeStep === "service"} icon={ArrowLeft} onClick={goBack} type="button" variant="ghost">
                Back
              </Button>

              {activeStep !== "finish" ? (
                <Button disabled={!canContinue} icon={ArrowRight} iconPosition="right" onClick={goNext} type="button">
                  {activeStep === "brief" && currentQuestionIndex < selectedQuestions.length - 1 ? "Next question" : "Continue"}
                </Button>
              ) : (
                <Button
                  disabled={!canSubmit || status === "saving" || status === "redirecting"}
                  icon={status === "saving" || status === "redirecting" ? Loader2 : isOffer ? MessageCircle : CreditCard}
                  type="submit"
                >
                  {status === "redirecting"
                    ? "Opening checkout"
                    : status === "saving"
                      ? isOffer
                        ? "Sending offer"
                        : "Preparing checkout"
                      : isOffer
                        ? "Send offer for review"
                        : "Pay securely with Stripe"}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>

      <Modal onClose={() => setModalOpen(false)} open={modalOpen} title="Request received">
        <div className="success-modal">
          <Lightbulb aria-hidden size={30} />
          <p>
            {modalMessage || "Your request is saved and ready for the next step."} Reference {reference || "pending"}.
          </p>
        </div>
      </Modal>
      {handoffSessionId ? <LiveSupportWidget defaultOpen sessionId={handoffSessionId} /> : null}
    </section>
  );
}
