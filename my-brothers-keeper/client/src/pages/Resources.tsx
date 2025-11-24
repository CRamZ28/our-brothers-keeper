import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { BookOpen, Heart, Users } from "lucide-react";

type TabId = "grieving" | "friends" | "ongoing";

export default function Resources() {
  const [activeTab, setActiveTab] = useState<TabId>("grieving");

  const tabs = [
    { id: "grieving" as TabId, label: "For Those Who Are Grieving", icon: Heart },
    { id: "friends" as TabId, label: "For Friends & Family", icon: Users },
    { id: "ongoing" as TabId, label: "Ongoing Support & Community", icon: BookOpen },
  ];

  return (
    <DashboardLayout>
      <GlassPageLayout
        title="Resources & Support"
      >
        <p className="text-foreground/70 -mt-4 mb-6">
          Helpful guidance and resources for every stage of the grief journey
        </p>
        
        {/* Tab Navigation */}
        <div 
          className="rounded-2xl p-2 mb-6"
          style={{
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl 
                    font-medium text-sm transition-all duration-200
                    ${isActive 
                      ? 'text-white shadow-lg' 
                      : 'text-foreground hover:bg-white/30 active:scale-[0.98]'
                    }
                  `}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)'
                  } : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.id === "grieving" ? "Grieving" : tab.id === "friends" ? "Friends & Family" : "Ongoing"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div 
          className="rounded-2xl p-8"
          style={{
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          {activeTab === "grieving" && <GrievingContent />}
          {activeTab === "friends" && <FriendsContent />}
          {activeTab === "ongoing" && <OngoingContent />}
        </div>
      </GlassPageLayout>
    </DashboardLayout>
  );
}

function GrievingContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-foreground mb-4">You Are Not Alone</h3>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Grief is a deeply personal journey, and there's no "right" way to grieve. These resources are here to provide comfort, understanding, and practical support as you navigate this difficult time.
        </p>
      </div>

      <Section title="Understanding Grief">
        <ResourceCard 
          title="The Five Stages of Grief"
          description="While grief doesn't always follow a linear path, understanding common emotional responses can help you feel less alone."
          items={[
            "Denial: Shock and disbelief",
            "Anger: Frustration and questioning",
            "Bargaining: What-if thoughts",
            "Depression: Deep sadness and withdrawal",
            "Acceptance: Finding a new normal"
          ]}
        />
        <p className="text-sm text-foreground/70 italic mt-4">
          Remember: These stages aren't a checklist. You may experience them in any order, skip some, or revisit others.
        </p>
      </Section>

      <Section title="Taking Care of Yourself">
        <ResourceCard 
          title="Self-Care During Grief"
          description="Practical ways to care for your physical and emotional wellbeing:"
          items={[
            "Allow yourself to feel whatever you're feeling",
            "Maintain simple routines (meals, sleep, basic hygiene)",
            "Accept help from others when offered",
            "Give yourself permission to take breaks from grief",
            "Seek professional support if you're struggling",
            "Remember: healing isn't linear"
          ]}
        />
      </Section>

      <Section title="When to Seek Professional Help">
        <div className="text-foreground/80 space-y-3">
          <p>Consider reaching out to a grief counselor or therapist if you experience:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Persistent thoughts of harming yourself</li>
            <li>Inability to care for yourself or dependents</li>
            <li>Complete withdrawal from all social connections</li>
            <li>Inability to function in daily life after several months</li>
          </ul>
          <p className="font-medium mt-4">Crisis Resources:</p>
          <div 
            className="p-4 rounded-lg mt-2"
            style={{
              background: 'rgba(45, 181, 168, 0.1)',
              border: '1px solid rgba(45, 181, 168, 0.3)'
            }}
          >
            <p className="font-semibold text-foreground">National Suicide Prevention Lifeline</p>
            <p className="text-lg font-bold" style={{ color: '#2DB5A8' }}>988</p>
            <p className="text-sm text-foreground/70">Available 24/7 for crisis support</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

function FriendsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-foreground mb-4">Supporting Someone Through Grief</h3>
        <p className="text-foreground/80 leading-relaxed mb-4">
          When someone you care about is grieving, it's natural to want to help. Here's how you can provide meaningful, lasting support.
        </p>
      </div>

      <Section title="What TO Say and Do">
        <ResourceCard 
          title="Helpful Phrases"
          description="Simple, sincere words that show you care:"
          items={[
            "\"I'm so sorry for your loss\"",
            "\"I'm here for you\"",
            "\"This must be incredibly difficult\"",
            "\"There are no words, but I'm thinking of you\"",
            "\"Take all the time you need\"",
            "\"Would it help to talk about [loved one's name]?\""
          ]}
        />
        <ResourceCard 
          title="Practical Actions"
          description="Concrete ways to help:"
          items={[
            "Bring a meal (use the Meal Train feature!)",
            "Offer specific help: \"Can I mow your lawn this Saturday?\"",
            "Check in regularly, even weeks/months later",
            "Remember important dates (birthdays, anniversaries)",
            "Just sit with them - presence matters more than words",
            "Share memories of their loved one"
          ]}
        />
      </Section>

      <Section title="What NOT to Say">
        <ResourceCard 
          title="Avoid These Common Phrases"
          description="Well-meaning but unhelpful statements to skip:"
          items={[
            "\"They're in a better place\" - Let them decide this",
            "\"I know how you feel\" - Every grief is unique",
            "\"Everything happens for a reason\" - Minimizes their pain",
            "\"At least they lived a long life\" - Loss hurts regardless",
            "\"You need to be strong\" - They need permission to grieve",
            "\"You should be over this by now\" - There's no grief timeline"
          ]}
        />
      </Section>

      <Section title="Long-Term Support">
        <div className="text-foreground/80 space-y-3">
          <p className="font-medium">The weeks and months after a loss are often the hardest:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Continue checking in after the initial crisis passes</li>
            <li>Remember that grief intensifies on holidays, birthdays, and anniversaries</li>
            <li>Don't be afraid to mention their loved one's name</li>
            <li>Offer help with overwhelming tasks (paperwork, estate matters)</li>
            <li>Be patient with mood changes and cancelled plans</li>
            <li>Celebrate small victories in their healing journey</li>
          </ul>
        </div>
      </Section>
    </div>
  );
}

function OngoingContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-foreground mb-4">Building a Support Community</h3>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Sustained support requires coordination and commitment. Here's how to build an effective, long-lasting support network.
        </p>
      </div>

      <Section title="Organizing Effective Support">
        <ResourceCard 
          title="Keys to Sustainable Support"
          description="How to provide help that lasts:"
          items={[
            "Coordinate with others to avoid overwhelming the family",
            "Spread out support over weeks and months, not just the first week",
            "Check in regularly but respect their need for space",
            "Remember important dates throughout the year",
            "Adapt your support as their needs change",
            "Take care of yourself to avoid burnout"
          ]}
        />
      </Section>

      <Section title="Using This Platform Effectively">
        <div className="grid gap-4 sm:grid-cols-2">
          <FeatureCard 
            icon="📋"
            title="Needs Board"
            description="Coordinate practical help like errands, childcare, and household tasks"
          />
          <FeatureCard 
            icon="🍽️"
            title="Meal Train"
            description="Schedule meals to ensure the family is fed without overwhelming them"
          />
          <FeatureCard 
            icon="📅"
            title="Events Calendar"
            description="Keep track of important dates, appointments, and memorial events"
          />
          <FeatureCard 
            icon="💬"
            title="Family Updates"
            description="Stay informed about how the family is doing and what they need"
          />
          <FeatureCard 
            icon="❤️"
            title="Memory Wall"
            description="Share stories, photos, and memories to celebrate their loved one's life"
          />
          <FeatureCard 
            icon="🔔"
            title="Reminders"
            description="Set personal reminders to check in and provide ongoing support"
          />
        </div>
      </Section>

      <Section title="Building Community Resilience">
        <ResourceCard 
          title="Creating Lasting Support"
          description="Beyond individual actions:"
          items={[
            "Establish a core support team to coordinate efforts",
            "Create a rotation for check-ins so no one carries the full load",
            "Plan for milestones: 1 month, 3 months, 6 months, 1 year",
            "Organize memorial events on important dates",
            "Build traditions to honor their loved one's memory",
            "Support other supporters - this is emotionally taxing work"
          ]}
        />
      </Section>

      <Section title="When to Step Back">
        <div className="text-foreground/80 space-y-3">
          <p>Respect the family's evolving needs:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>If they ask for space, honor that request</li>
            <li>Let them lead - follow their cues on what feels helpful</li>
            <li>Don't take it personally if they withdraw temporarily</li>
            <li>Make it clear you're available when they're ready</li>
            <li>Trust that your past support made a difference</li>
          </ul>
        </div>
      </Section>
    </div>
  );
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h4 className="text-xl font-semibold text-foreground border-b border-foreground/20 pb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function ResourceCard({ 
  title, 
  description, 
  items 
}: { 
  title: string; 
  description: string; 
  items: string[];
}) {
  return (
    <div 
      className="p-5 rounded-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}
    >
      <h5 className="font-semibold text-foreground mb-2">{title}</h5>
      <p className="text-sm text-foreground/70 mb-3">{description}</p>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-foreground/80">
            <span className="text-teal-500 mt-1">•</span>
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <div 
      className="p-4 rounded-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h5 className="font-semibold text-foreground mb-1">{title}</h5>
      <p className="text-sm text-foreground/70">{description}</p>
    </div>
  );
}
