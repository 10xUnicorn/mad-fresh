"use client";

import { useState, useEffect } from "react";
import { Mail, ChevronRight, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { FoodPersonalityType } from "@/types/database";

interface QuizQuestion {
  id: number;
  question: string;
  answers: Array<{ emoji: string; label: string; personalityType: FoodPersonalityType }>;
}

interface PersonalityProfile {
  type: FoodPersonalityType;
  name: string;
  description: string;
  emoji: string;
  recommendedRecipes: string[];
  planSuggestion: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Who are you?",
    answers: [
      { emoji: "⚖️", label: "The Balanced One — I want consistency without extremes", personalityType: "balanced_betty" },
      { emoji: "💪", label: "The Gains Machine — I train hard and eat to match", personalityType: "beefy_bro" },
      { emoji: "✨", label: "The Clean Eater — Every ingredient matters to me", personalityType: "clean_machine" },
      { emoji: "🌱", label: "The Plant Warrior — Plant-based is my lifestyle", personalityType: "plant_power" },
    ],
  },
  {
    id: 2,
    question: "When it comes to staying on track with eating healthy, your biggest challenge is...",
    answers: [
      { emoji: "⏱️", label: "Finding time to prep meals", personalityType: "balanced_betty" },
      { emoji: "🥚", label: "Getting enough protein without getting bored", personalityType: "beefy_bro" },
      { emoji: "🛒", label: "Avoiding processed junk when I'm busy", personalityType: "clean_machine" },
      { emoji: "🥣", label: "Finding plant-based options that actually fill me up", personalityType: "plant_power" },
    ],
  },
  {
    id: 3,
    question: "Your ideal Saturday looks like...",
    answers: [
      { emoji: "🧘", label: "Yoga, brunch with friends, productive afternoon", personalityType: "balanced_betty" },
      { emoji: "💪", label: "Intense morning workout, protein-heavy brunch, planning my week", personalityType: "beefy_bella" },
      { emoji: "🌾", label: "Farmers market, cook something new, early night", personalityType: "clean_machine" },
      { emoji: "🥾", label: "Hiking, smoothie bowl, community event", personalityType: "plant_power" },
    ],
  },
  {
    id: 4,
    question: "What's your relationship with food?",
    answers: [
      { emoji: "⚡", label: "Fuel that should taste good — I don't overthink it", personalityType: "balanced_betty" },
      { emoji: "📊", label: "Strategic — I track macros and plan meals", personalityType: "beefy_bro" },
      { emoji: "🔬", label: "Mindful — I care about what goes in my body", personalityType: "clean_machine" },
      { emoji: "🎉", label: "Joyful — cooking and sharing food is my love language", personalityType: "social_foodie" },
    ],
  },
  {
    id: 5,
    question: "What would help you the most right now?",
    answers: [
      { emoji: "📦", label: "Meals ready to go so I stop skipping lunch", personalityType: "balanced_betty" },
      { emoji: "💯", label: "A plan that helps me hit my body composition goals", personalityType: "beefy_bella" },
      { emoji: "🧾", label: "Knowing exactly what's in my food, down to the ingredient", personalityType: "clean_machine" },
      { emoji: "🌈", label: "Variety that keeps me excited about eating healthy", personalityType: "social_foodie" },
    ],
  },
  {
    id: 6,
    question: "When someone asks about your diet, you say...",
    answers: [
      { emoji: "🤷", label: "I just try to eat balanced — nothing crazy", personalityType: "balanced_betty" },
      { emoji: "🎯", label: "I'm on a serious program right now", personalityType: "beefy_bro" },
      { emoji: "🌿", label: "I eat whole foods — no processed anything", personalityType: "clean_machine" },
      { emoji: "✌️", label: "I don't do diets — I do lifestyle", personalityType: "plant_power" },
    ],
  },
  {
    id: 7,
    question: "Pick the workout that speaks to you:",
    answers: [
      { emoji: "🧘", label: "Pilates, walking, or a solid gym routine", personalityType: "balanced_betty" },
      { emoji: "🏋️", label: "Heavy lifting, CrossFit, or combat sports", personalityType: "beefy_bro" },
      { emoji: "🏃", label: "Running, swimming, or functional training", personalityType: "clean_machine" },
      { emoji: "🕉️", label: "Yoga, dance, hiking, or martial arts", personalityType: "plant_power" },
    ],
  },
];

const PERSONALITY_PROFILES: Record<FoodPersonalityType, PersonalityProfile> = {
  balanced_betty: {
    type: "balanced_betty",
    name: "Balanced Betty",
    description:
      "You're all about sustainability and balance. You know that the best diet is one you can actually stick to. You appreciate variety, good nutrition, and meals that fit your lifestyle without requiring perfection.",
    emoji: "⚖️",
    recommendedRecipes: ["Buddha Bowl", "Greek Salad Wrap", "Grain & Veggie Blend"],
    planSuggestion: "Our Balanced Membership (3 meals/week) keeps variety flowing without commitment overload.",
  },
  balanced_brad: {
    type: "balanced_brad",
    name: "Balanced Brad",
    description:
      "You're the strategic nutritionist of your friend group. Balanced and thoughtful, you appreciate meals that hit your macro targets while still tasting incredible. You're disciplined but not extreme.",
    emoji: "⚖️",
    recommendedRecipes: ["Protein Power Bowl", "Grilled Chicken Wrap", "Quinoa Power Plate"],
    planSuggestion: "Our Balanced Membership (3 meals/week) with macro tracking keeps you dialed in.",
  },
  beefy_bro: {
    type: "beefy_bro",
    name: "Beefy Bro",
    description:
      "You're driven, disciplined, and don't do anything halfway. You live for gains and understand that serious results require serious nutrition. High protein, quality ingredients, and zero excuses.",
    emoji: "💪",
    recommendedRecipes: ["High-Protein Power Bowl", "Steak & Sweet Potato", "Muscle Mass Deluxe"],
    planSuggestion: "Our Gains Membership (5 meals/week) with 40g+ protein per meal. Let's build.",
  },
  beefy_bella: {
    type: "beefy_bella",
    name: "Beefy Bella",
    description:
      "You're strong, confident, and absolutely crush your fitness goals. You know that great nutrition is about feeling powerful and capable. You want meals that match your intensity and ambition.",
    emoji: "💪",
    recommendedRecipes: ["Powerhouse Bowl", "High-Protein Wrap", "Strength Builder Plate"],
    planSuggestion: "Our Gains Membership (5 meals/week) builds the fuel you need to dominate.",
  },
  clean_machine: {
    type: "clean_machine",
    name: "Clean Machine",
    description:
      "You're the optimization expert. Every ingredient matters. You track nutrition meticulously, avoid processed foods, and understand that your body is a temple. Pure ingredients, pure results.",
    emoji: "✨",
    recommendedRecipes: ["Organic Grilled Bowl", "Grass-Fed Beef Plate", "Clean Detox Salad"],
    planSuggestion: "Our Clean Membership (4 meals/week) sources organic, non-GMO ingredients exclusively.",
  },
  social_foodie: {
    type: "social_foodie",
    name: "Social Foodie",
    description:
      "Food is culture, connection, and joy for you. You love amazing flavors, diverse cuisines, and the experience of eating. You believe that delicious food brings people together and that nutrition shouldn't be boring.",
    emoji: "🎉",
    recommendedRecipes: ["Miso Bowls", "Street-Style Tacos", "Global Flavor Wraps", "Seasonal Salads"],
    planSuggestion: "Our Social Membership (4 meals/week) rotates global cuisines to keep your palate excited.",
  },
  plant_power: {
    type: "plant_power",
    name: "Plant Power",
    description:
      "You lead with your values. Plant-based isn't just a diet—it's a commitment to your health, the planet, and animal welfare. You're passionate about proving that plant nutrition is powerful nutrition.",
    emoji: "🌱",
    recommendedRecipes: ["Buddha Power Bowl", "Chickpea Protein Wrap", "Lentil & Walnut Plate"],
    planSuggestion: "Our Plant Power Membership (4 meals/week) is 100% plant-based and nutrient-dense.",
  },
};

export default function QuizPage() {
  const [email, setEmail] = useState("");
  const [showEmailStep, setShowEmailStep] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<FoodPersonalityType[]>([]);
  const [personalityType, setPersonalityType] = useState<FoodPersonalityType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const supabase = createClient();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setShowEmailStep(false);
      setCurrentQuestion(1);
    }
  };

  const handleAnswerSelect = async (selectedType: FoodPersonalityType) => {
    const newAnswers = [...answers, selectedType];
    setAnswers(newAnswers);

    if (newAnswers.length === QUIZ_QUESTIONS.length) {
      // Quiz complete - calculate personality type
      await calculateAndSaveResults(email, newAnswers);
    } else if (newAnswers.length === 1) {
      // After question 1, show email collection step
      setShowEmailStep(true);
    } else {
      // Move to next question
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const calculateAndSaveResults = async (userEmail: string, userAnswers: FoodPersonalityType[]) => {
    setIsLoading(true);

    // Calculate personality type by counting occurrences
    const typeCounts: Record<FoodPersonalityType, number> = {
      balanced_betty: 0,
      balanced_brad: 0,
      beefy_bro: 0,
      beefy_bella: 0,
      clean_machine: 0,
      social_foodie: 0,
      plant_power: 0,
    };

    userAnswers.forEach(type => {
      typeCounts[type]++;
    });

    // Find type with highest count (tie = first one wins)
    let determinedType: FoodPersonalityType = "balanced_betty";
    let maxCount = 0;

    (Object.entries(typeCounts) as Array<[FoodPersonalityType, number]>).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        determinedType = type;
      }
    });

    setPersonalityType(determinedType);

    // Save to Supabase
    try {
      const { error } = await supabase.from("contacts").upsert(
        {
          store_id: "b0000000-0000-0000-0000-000000000001",
          email: userEmail,
          first_name: "",
          last_name: "",
          source: "quiz" as const,
          is_waitlist_member: true,
          food_personality_type: determinedType,
          tags: ["quiz_completed"],
        },
        {
          onConflict: "email",
        }
      );

      if (error) {
        console.error("Error saving quiz results:", error);
      }
    } catch (error) {
      console.error("Error saving to Supabase:", error);
    }

    setShowResults(true);
    setIsLoading(false);
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText("QUIZ15");
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };


  if (showResults && personalityType) {
    const profile = PERSONALITY_PROFILES[personalityType];

    return (
      <main className="min-h-screen bg-[#faf8f3] py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Results Container */}
          <div className="space-y-8">
            {/* Checkmark Animation */}
            <div className="flex justify-center mb-8">
              <div className="animate-bounce">
                <CheckCircle2 size={80} className="text-[#3d6b2a]" />
              </div>
            </div>

            {/* Personality Profile */}
            <div className="bg-white border border-[#ddd8cc] rounded-3xl p-8 space-y-6">
              <div className="text-center space-y-3">
                <h1 className="text-6xl mb-4">{profile.emoji}</h1>
                <h2 className="text-4xl font-black text-[#1e2d18]">{profile.name}</h2>
                <p className="text-lg text-[#4a5e3a] leading-relaxed">{profile.description}</p>
              </div>

              {/* Recommended Recipes */}
              <div className="border-t border-[#ddd8cc] pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-[#1e2d18]">Your Favorites</h3>
                <div className="space-y-2">
                  {profile.recommendedRecipes.map((recipe, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#f2efe8] rounded-lg">
                      <div className="w-2 h-2 bg-[#3d6b2a] rounded-full" />
                      <span className="text-[#4a5e3a]">{recipe}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan Suggestion */}
              <div className="border-t border-[#ddd8cc] pt-6 space-y-3 bg-[#e9f0e4] rounded-xl p-4">
                <h3 className="font-semibold text-[#3d6b2a]">We Recommend:</h3>
                <p className="text-[#4a5e3a]">{profile.planSuggestion}</p>
              </div>
            </div>

            {/* Coupon Card */}
            <div className="bg-white border border-[#ddd8cc] rounded-3xl p-8 space-y-4">
              <h3 className="font-semibold text-[#1e2d18]">Quiz Complete Bonus</h3>
              <div className="bg-gradient-to-r from-[#449531]/20 to-[#75F663]/20 rounded-xl p-6 border border-[#75F663]/30 space-y-3">
                <p className="text-sm text-[#7a7060]">Use code at checkout:</p>
                <div className="flex items-center justify-between gap-4 bg-black/40 rounded-lg p-4">
                  <span className="text-2xl font-bold text-[#3d6b2a]">QUIZ15</span>
                  <button
                    onClick={handleCopyCoupon}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[#1e2d18] transition min-h-[44px]"
                  >
                    {copiedCoupon ? (
                      <>
                        <CheckCircle2 size={18} className="text-[#3d6b2a]" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-[#7a7060]">15% off your first order</p>
              </div>
            </div>

            {/* CTA */}
            <a
              href="/menu"
              className="block w-full bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold rounded-full transition-colors font-bold py-3 rounded-full text-center transition flex items-center justify-center gap-2 min-h-[44px]"
            >
              Browse Menu
              <ChevronRight size={20} />
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-[#3d6b2a] animate-spin" />
          <p className="text-[#7a7060]">Finding your match...</p>
        </div>
      </main>
    );
  }

  // Email step after question 1
  if (showEmailStep) {
    const progress = (1 / QUIZ_QUESTIONS.length) * 100;

    return (
      <main className="min-h-screen bg-[#faf8f3] py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Progress Bar */}
          <div className="mb-12 space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-black text-[#1e2d18]">Food Personality Quiz</h1>
              <span className="text-sm text-[#7a7060]">
                {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#449531] to-[#75F663] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Email Collection Card */}
          <div className="bg-white border border-[#ddd8cc] rounded-3xl p-8 max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <Mail size={28} className="text-[#3d6b2a]" />
              <h2 className="text-2xl font-bold text-[#1e2d18]">Almost There</h2>
            </div>
            <p className="text-[#7a7060]">
              Share your email to unlock your personalized results and get exclusive meal recommendations.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a] transition"
              />
              <button
                type="submit"
                className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold rounded-full transition-colors w-full font-bold py-3 rounded-full transition min-h-[44px]"
              >
                Continue Quiz
              </button>
            </form>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: QUIZ_QUESTIONS.length }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx < 1
                      ? "bg-[#3d6b2a] w-6"
                      : idx === 1
                        ? "bg-[#3d6b2a] w-8"
                        : "bg-white/10 w-2"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Quiz Question
  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <main className="min-h-screen bg-[#faf8f3] py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Progress Bar */}
        <div className="mb-12 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-[#1e2d18]">Food Personality Quiz</h1>
            <span className="text-sm text-[#7a7060]">
              {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#449531] to-[#75F663] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-[#ddd8cc] rounded-3xl p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1e2d18] leading-relaxed">{question.question}</h2>
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-4">
            {question.answers.map((answer, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(answer.personalityType)}
                className="group relative p-6 rounded-2xl border border-[#ddd8cc] bg-[#f2efe8] hover:bg-white/10 hover:border-[#449531]/50 transition space-y-3"
              >
                <div className="text-5xl">{answer.emoji}</div>
                <div>
                  <p className="font-semibold text-[#1e2d18] text-left group-hover:text-[#3d6b2a] transition">
                    {answer.label}
                  </p>
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-[#75F663] opacity-0 group-hover:opacity-100 transition pointer-events-none" />
              </button>
            ))}
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: QUIZ_QUESTIONS.length }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx < currentQuestion
                    ? "bg-[#3d6b2a] w-6"
                    : idx === currentQuestion
                      ? "bg-[#3d6b2a] w-8"
                      : "bg-white/10 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
