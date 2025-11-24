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
      <GlassPageLayout title="Resources & Support">
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
        <div className="space-y-6">
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
      {/* Card 1: When the Shock Fades */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          When the Shock Fades, but the Pain Stays
        </h3>
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>
            Grief often hits hardest after the first few weeks — once the meals stop coming, once texts slow down, once life around you seems to move forward.
            <br />
            This doesn't mean you're doing it wrong. It means your heart is recognizing the depth of your loss.
          </p>
          
          <div>
            <p className="font-medium mb-2">It is normal to feel:</p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>More sadness or heaviness than you expected</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Numbness followed by waves of emotion</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Loneliness, even when surrounded by people</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Difficulty focusing or sleeping</span>
              </li>
            </ul>
          </div>

          <p className="italic text-foreground/90 pt-2">
            Your grief is a sign of love. Healing is not linear — and you don't have to rush it.
          </p>
        </div>
      </GlassCard>

      {/* Card 2: Coping Tools */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Coping Tools You Can Use Daily
        </h3>
        
        <div className="space-y-5">
          {/* Breathing & Grounding */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Breathing & Grounding</h4>
            <p className="text-foreground/80 leading-relaxed">
              When emotions surge, pause and breathe slowly.
              <br />
              Focus on your inhale, your exhale, and remind yourself:
              <br />
              <span className="italic">"I am safe. I am not alone. God is here."</span>
            </p>
          </div>

          {/* Journaling Prompts */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Journaling Prompts</h4>
            <ul className="space-y-1.5 ml-4 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>"What is one thing I miss today?"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>"Where did I feel God's comfort recently?"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>"What is one thing I wish others understood?"</span>
              </li>
            </ul>
          </div>

          {/* Faith & Prayer */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Faith & Prayer Practices</h4>
            <ul className="space-y-1.5 ml-4 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Pray a simple breath prayer: "Lord, hold my heart."</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Read Psalm 34:18: "The Lord is close to the brokenhearted…"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Spend quiet time just resting, not performing.</span>
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Card 3: Words of Comfort */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-6">
          Words of Comfort
        </h3>
        
        <div className="text-center space-y-6 py-4">
          <div className="text-lg italic text-foreground/90 leading-relaxed">
            "Blessed are those who mourn,
            <br />
            for they will be comforted."
            <br />
            <span className="text-base not-italic text-foreground/70 mt-2 block">— Matthew 5:4</span>
          </div>

          <p className="text-foreground/80 leading-relaxed max-w-xl mx-auto">
            God does not rush your healing.
            <br />
            He sits with you in the dark, even when no one else sees your pain.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

function FriendsContent() {
  return (
    <div className="space-y-6">
      {/* Card 4: How to Help */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          How to Help a Grieving Friend
        </h3>
        
        <div className="space-y-5">
          {/* What Helps */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">What Helps</h4>
            <ul className="space-y-2 ml-4 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Listen more than you speak. Let them talk, cry, or sit in silence.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Be consistent. Keep checking in long after the funeral.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <div className="flex-1">
                  <span>Offer specific help, like:</span>
                  <ul className="mt-1.5 ml-4 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-teal-400">–</span>
                      <span>"Can I bring dinner Thursday?"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-400">–</span>
                      <span>"Want me to pick up groceries?"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-400">–</span>
                      <span>"I'm driving your way — need anything?"</span>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>

          {/* What Doesn't Help */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">What Doesn't Help</h4>
            <ul className="space-y-1.5 ml-4 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Avoid clichés like "They're in a better place" or "Stay strong."</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Don't rush them. Grief takes months and years, not days.</span>
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Card 5: Helpful vs Hurtful Words */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Helpful Words vs. Hurtful Words
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Helpful */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-teal-600">Helpful to Say</h4>
            <ul className="space-y-2 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>"I'm here with you."</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>"This must be so hard."</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>"I'm not going anywhere."</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>"I'd love to hear a story about them."</span>
              </li>
            </ul>
          </div>

          {/* Avoid */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-red-600">Avoid Saying</h4>
            <ul className="space-y-2 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>"Everything happens for a reason."</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>"At least they lived a long life."</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>"You should try to move on."</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>"I know exactly how you feel."</span>
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Card 6: Actions That Show Love */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Actions That Show Love
        </h3>
        
        <div className="space-y-5">
          <ul className="space-y-2 ml-4 text-foreground/80">
            <li className="flex items-start gap-2">
              <span className="text-teal-500 mt-1">•</span>
              <span>Send a message: "Thinking of you today."</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 mt-1">•</span>
              <span>Offer practical help with food, errands, or childcare.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 mt-1">•</span>
              <span>Schedule reminders to check in weekly, even months later.</span>
            </li>
          </ul>

          <p className="italic text-foreground/90 pt-2">
            Your consistency heals in ways you may never see.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <ActionButton icon="💬">Send a message</ActionButton>
            <ActionButton icon="🤝">Offer help</ActionButton>
            <ActionButton icon="🔔">Schedule a check-in</ActionButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function OngoingContent() {
  return (
    <div className="space-y-6">
      {/* Card 7: Why Continued Support Matters */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Why Continued Support Matters
        </h3>
        
        <div className="space-y-4 text-foreground/80 leading-relaxed">
          <p>
            Most people receive support for 2–4 weeks, but grief lasts far longer.
          </p>

          <div>
            <p className="font-medium mb-2">Over time, people in grief often feel:</p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Forgotten</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>"Too much" to talk about</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Unsure who to reach out to</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Guilty asking for help</span>
              </li>
            </ul>
          </div>

          <p className="pt-2">
            Your long-term support helps break the isolation that can grow months later.
            <br />
            It reminds them their loved one still matters — and so do they.
          </p>
        </div>
      </GlassCard>

      {/* Card 8: Reminder Templates */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Reminder Templates
        </h3>
        
        <div className="space-y-4">
          <ReminderTemplate 
            title="1 Month Check-In"
            message={`"It's been a month. How are you doing today? I'm here."`}
          />
          <ReminderTemplate 
            title="Birthday or Anniversary Remembrance"
            message={`"Thinking of you today. I remember them with you."`}
          />
          <ReminderTemplate 
            title="Holiday Support"
            message={`"The holidays can be bittersweet. How can I support you?"`}
          />
        </div>
      </GlassCard>

      {/* Card 9: Find Help */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Find Help
        </h3>
        
        <div className="space-y-5 text-foreground/80">
          <p className="leading-relaxed">
            Sometimes additional support is needed, and that's okay.
          </p>

          <div>
            <h4 className="font-semibold text-foreground mb-2">Local & Faith-Based Support</h4>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Church counseling or pastoral care</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Local grief support groups</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Christian counselors or therapists</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">Online Resources</h4>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Grief devotionals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Faith-based grief workshops</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-1">•</span>
                <span>Audio prayers for comfort</span>
              </li>
            </ul>
          </div>

          <p className="italic pt-2">
            Seeking help is a sign of courage, not weakness.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

// Helper Components
function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="rounded-2xl p-6 lg:p-8"
      style={{
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}
    >
      {children}
    </div>
  );
}

function ActionButton({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground transition-all hover:bg-white/30"
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}
    >
      <span>{icon}</span>
      <span>{children}</span>
    </button>
  );
}

function ReminderTemplate({ title, message }: { title: string; message: string }) {
  return (
    <div 
      className="p-4 rounded-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.25)'
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h5 className="font-semibold text-foreground mb-1">{title}</h5>
          <p className="text-sm text-foreground/80 italic">{message}</p>
        </div>
        <button
          className="shrink-0 px-3 py-1.5 rounded text-xs font-medium text-white transition-all hover:bg-[#9A7890]"
          style={{ backgroundColor: '#B08CA7' }}
        >
          Set Reminder
        </button>
      </div>
    </div>
  );
}
