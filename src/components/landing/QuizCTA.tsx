import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function QuizCTA() {
  return (
    <section className="py-20 bg-[#faf8f3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white border border-[#ddd8cc] shadow-[0_8px_32px_rgba(30,45,24,.08)] rounded-3xl p-10 sm:p-16">
          <Sparkles size={40} className="text-[#3d6b2a] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-black text-[#1e2d18] tracking-tight mb-4">
            What&apos;s your food personality?
          </h2>
          <p className="text-[#7a7060] text-lg mb-8 max-w-xl mx-auto">
            Take our 60-second quiz and get a personalized bowl recommendation
            based on your goals, taste preferences, and lifestyle.
          </p>
          <Link
            href="/quiz"
            className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white inline-flex items-center gap-2 font-bold text-lg px-10 py-4 rounded-full transition-colors"
          >
            Take the Quiz
            <Sparkles size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
