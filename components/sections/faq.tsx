import { faqs } from "@/data/faqs";
import { Accordion } from "@/components/ui/accordion";

export function Faq() {
  return (
    <section className="section" id="faq">
      <div className="container split">
        <div className="section-header">
          <span className="eyebrow">FAQ</span>
          <h2 className="title">Quick answers.</h2>
          <p className="subtitle">Short, plain answers before you start.</p>
        </div>
        <Accordion items={faqs} />
      </div>
    </section>
  );
}
