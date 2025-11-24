import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { GlassPageLayout } from "@/components/GlassPageLayout";
import { BookOpen, Heart, Users } from "lucide-react";

type TabId = "grieving" | "friends" | "ongoing";

export default function Resources() {
  const [activeTab, setActiveTab] = useState<TabId>("grieving");
  const [, setLocation] = useLocation();

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
          {activeTab === "friends" && <FriendsContent setLocation={setLocation} />}
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
        <div className="flex items-start gap-4 mb-4">
          <div 
            className="p-3 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)',
              boxShadow: '0 4px 12px rgba(176, 140, 167, 0.3)'
            }}
          >
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mt-2" style={{
            background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            When the Shock Fades, but the Pain Stays
          </h3>
        </div>
        <div className="space-y-4 text-foreground/85 leading-relaxed">
          <p className="text-base">
            Grief often hits hardest after the first few weeks — once the meals stop coming, once texts slow down, once life around you seems to move forward.
            <br />
            <span className="font-medium text-foreground">This doesn't mean you're doing it wrong.</span> It means your heart is recognizing the depth of your loss.
          </p>
          
          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(176, 140, 167, 0.08) 0%, rgba(155, 127, 184, 0.08) 100%)',
              border: '1px solid rgba(176, 140, 167, 0.2)'
            }}
          >
            <p className="font-semibold text-foreground mb-3" style={{ color: '#B08CA7' }}>It is normal to feel:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>More sadness or heaviness than you expected</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>Numbness followed by waves of emotion</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>Loneliness, even when surrounded by people</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>Difficulty focusing or sleeping</span>
              </li>
            </ul>
          </div>

          <div 
            className="p-4 rounded-xl text-center italic text-base"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 181, 168, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
              border: '1px solid rgba(45, 181, 168, 0.3)'
            }}
          >
            <span className="font-medium text-foreground">Your grief is a sign of love.</span> Healing is not linear — and you don't have to rush it.
          </div>
        </div>
      </GlassCard>

      {/* Card 2: Coping Tools */}
      <GlassCard>
        <div className="flex items-start gap-4 mb-5">
          <div 
            className="p-3 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2DB5A8 0%, #14b8a6 100%)',
              boxShadow: '0 4px 12px rgba(45, 181, 168, 0.3)'
            }}
          >
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mt-2" style={{
            background: 'linear-gradient(135deg, #2DB5A8 0%, #14b8a6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Coping Tools You Can Use Daily
          </h3>
        </div>
        
        <div className="space-y-5">
          {/* Breathing & Grounding */}
          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 181, 168, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
              border: '1px solid rgba(45, 181, 168, 0.2)'
            }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#2DB5A8' }}>
              <span className="text-xl">🌬️</span>
              Breathing & Grounding
            </h4>
            <p className="text-foreground/85 leading-relaxed">
              When emotions surge, pause and breathe slowly.
              <br />
              Focus on your inhale, your exhale, and remind yourself:
              <br />
              <span className="italic font-medium text-foreground mt-2 block">"I am safe. I am not alone. God is here."</span>
            </p>
          </div>

          {/* Journaling Prompts */}
          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(176, 140, 167, 0.08) 0%, rgba(155, 127, 184, 0.08) 100%)',
              border: '1px solid rgba(176, 140, 167, 0.2)'
            }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#B08CA7' }}>
              <span className="text-xl">📝</span>
              Journaling Prompts
            </h4>
            <ul className="space-y-2 text-foreground/85">
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>"What is one thing I miss today?"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>"Where did I feel God's comfort recently?"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>"What is one thing I wish others understood?"</span>
              </li>
            </ul>
          </div>

          {/* Faith & Prayer */}
          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 181, 168, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
              border: '1px solid rgba(45, 181, 168, 0.2)'
            }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#2DB5A8' }}>
              <span className="text-xl">🙏</span>
              Faith & Prayer Practices
            </h4>
            <ul className="space-y-2 text-foreground/85">
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>Pray a simple breath prayer: <span className="font-medium">"Lord, hold my heart."</span></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>Read Psalm 34:18: <span className="italic">"The Lord is close to the brokenhearted…"</span></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>Spend quiet time just resting, not performing.</span>
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Card 3: Words of Comfort */}
      <GlassCard>
        <div className="flex items-start gap-4 mb-6">
          <div 
            className="p-3 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)',
              boxShadow: '0 4px 12px rgba(176, 140, 167, 0.3)'
            }}
          >
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="text-xl font-bold mt-2" style={{
            background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Words of Comfort
          </h3>
        </div>
        
        <div 
          className="text-center space-y-6 py-6 px-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(176, 140, 167, 0.1) 0%, rgba(155, 127, 184, 0.1) 100%)',
            border: '2px solid rgba(176, 140, 167, 0.3)'
          }}
        >
          <div className="text-2xl italic text-foreground leading-relaxed font-serif">
            "Blessed are those who mourn,
            <br />
            for they will be comforted."
            <br />
            <span className="text-lg not-italic text-foreground/70 mt-3 block font-sans">— Matthew 5:4</span>
          </div>

          <div className="w-16 h-1 mx-auto rounded-full" style={{
            background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)'
          }}></div>

          <p className="text-foreground/85 leading-relaxed max-w-xl mx-auto text-lg">
            God does not rush your healing.
            <br />
            He sits with you in the dark, even when no one else sees your pain.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

function FriendsContent({ setLocation }: { setLocation: any }) {
  return (
    <div className="space-y-6">
      {/* Card 4: How to Help */}
      <GlassCard>
        <div className="flex items-start gap-4 mb-5">
          <div 
            className="p-3 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2DB5A8 0%, #14b8a6 100%)',
              boxShadow: '0 4px 12px rgba(45, 181, 168, 0.3)'
            }}
          >
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mt-2" style={{
            background: 'linear-gradient(135deg, #2DB5A8 0%, #14b8a6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            How to Help a Grieving Friend
          </h3>
        </div>
        
        <div className="space-y-5">
          {/* What Helps */}
          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 181, 168, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
              border: '1px solid rgba(45, 181, 168, 0.2)'
            }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#2DB5A8' }}>
              <span className="text-xl">✅</span>
              What Helps
            </h4>
            <ul className="space-y-2 text-foreground/85">
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>Listen more than you speak. Let them talk, cry, or sit in silence.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>Be consistent. Keep checking in long after the funeral.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <div className="flex-1">
                  <span>Offer specific help, like:</span>
                  <ul className="mt-2 ml-4 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#14b8a6' }}>–</span>
                      <span>"Can I bring dinner Thursday?"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#14b8a6' }}>–</span>
                      <span>"Want me to pick up groceries?"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#14b8a6' }}>–</span>
                      <span>"I'm driving your way — need anything?"</span>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>

          {/* What Doesn't Help */}
          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.08) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
              <span className="text-xl">⚠️</span>
              What Doesn't Help
            </h4>
            <ul className="space-y-2 text-foreground/85">
              <li className="flex items-start gap-3">
                <span className="text-lg text-red-500">•</span>
                <span>Avoid clichés like "They're in a better place" or "Stay strong."</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg text-red-500">•</span>
                <span>Don't rush them. Grief takes months and years, not days.</span>
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Card 5: Helpful vs Hurtful Words */}
      <GlassCard>
        <div className="flex items-start gap-4 mb-5">
          <div 
            className="p-3 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)',
              boxShadow: '0 4px 12px rgba(176, 140, 167, 0.3)'
            }}
          >
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="text-xl font-bold mt-2" style={{
            background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Helpful Words vs. Hurtful Words
          </h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-5">
          {/* Helpful */}
          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 181, 168, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
              border: '1px solid rgba(45, 181, 168, 0.2)'
            }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#2DB5A8' }}>
              <span className="text-xl">💚</span>
              Helpful to Say
            </h4>
            <ul className="space-y-2.5 text-foreground/85">
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>"I'm here with you."</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>"This must be so hard."</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>"I'm not going anywhere."</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>"I'd love to hear a story about them."</span>
              </li>
            </ul>
          </div>

          {/* Avoid */}
          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.08) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
              <span className="text-xl">❌</span>
              Avoid Saying
            </h4>
            <ul className="space-y-2.5 text-foreground/85">
              <li className="flex items-start gap-3">
                <span className="text-lg text-red-500">•</span>
                <span>"Everything happens for a reason."</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg text-red-500">•</span>
                <span>"At least they lived a long life."</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg text-red-500">•</span>
                <span>"You should try to move on."</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg text-red-500">•</span>
                <span>"I know exactly how you feel."</span>
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Card 6: Actions That Show Love */}
      <GlassCard>
        <div className="flex items-start gap-4 mb-5">
          <div 
            className="p-3 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)',
              boxShadow: '0 4px 12px rgba(176, 140, 167, 0.3)'
            }}
          >
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mt-2" style={{
            background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Actions That Show Love
          </h3>
        </div>
        
        <div className="space-y-5">
          <ul className="space-y-3 text-foreground/85">
            <li className="flex items-start gap-3">
              <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
              <span>Send a message: <span className="font-medium">"Thinking of you today."</span></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
              <span>Offer practical help with food, errands, or childcare.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
              <span>Schedule reminders to check in weekly, even months later.</span>
            </li>
          </ul>

          <div 
            className="p-4 rounded-xl text-center italic text-base"
            style={{
              background: 'linear-gradient(135deg, rgba(176, 140, 167, 0.1) 0%, rgba(155, 127, 184, 0.1) 100%)',
              border: '1px solid rgba(176, 140, 167, 0.3)'
            }}
          >
            Your consistency heals in ways you may never see.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <ActionButton icon="💬" onClick={() => setLocation('/memory-wall')}>Send Encouragement</ActionButton>
            <ActionButton icon="🤝" onClick={() => setLocation('/needs')}>Help With Needs</ActionButton>
            <ActionButton icon="🔔" onClick={() => setLocation('/reminders')}>My Reminders</ActionButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function OngoingContent() {
  const copyReminderTemplate = async (template: string) => {
    try {
      await navigator.clipboard.writeText(template);
      alert('Template copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card 7: Why Continued Support Matters */}
      <GlassCard>
        <div className="flex items-start gap-4 mb-5">
          <div 
            className="p-3 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2DB5A8 0%, #14b8a6 100%)',
              boxShadow: '0 4px 12px rgba(45, 181, 168, 0.3)'
            }}
          >
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold mt-2" style={{
            background: 'linear-gradient(135deg, #2DB5A8 0%, #14b8a6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Why Continued Support Matters
          </h3>
        </div>
        
        <div className="space-y-4 text-foreground/85 leading-relaxed">
          <p className="text-base">
            Most people receive support for <span className="font-medium">2–4 weeks</span>, but grief lasts far longer.
          </p>

          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(176, 140, 167, 0.08) 0%, rgba(155, 127, 184, 0.08) 100%)',
              border: '1px solid rgba(176, 140, 167, 0.2)'
            }}
          >
            <p className="font-semibold mb-3" style={{ color: '#B08CA7' }}>Over time, people in grief often feel:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>Forgotten</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>"Too much" to talk about</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>Unsure who to reach out to</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>Guilty asking for help</span>
              </li>
            </ul>
          </div>

          <div 
            className="p-4 rounded-xl text-base"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 181, 168, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
              border: '1px solid rgba(45, 181, 168, 0.3)'
            }}
          >
            <p>Your long-term support helps break the isolation that can grow months later.</p>
            <p className="mt-2 font-medium">It reminds them their loved one still matters — and so do they.</p>
          </div>
        </div>
      </GlassCard>

      {/* Card 8: Reminder Templates */}
      <GlassCard>
        <div className="flex items-start gap-4 mb-5">
          <div 
            className="p-3 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)',
              boxShadow: '0 4px 12px rgba(176, 140, 167, 0.3)'
            }}
          >
            <span className="text-2xl">🔔</span>
          </div>
          <h3 className="text-xl font-bold mt-2" style={{
            background: 'linear-gradient(135deg, #B08CA7 0%, #9B7FB8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Reminder Templates
          </h3>
        </div>
        
        <div className="space-y-4">
          <ReminderTemplate 
            title="1 Month Check-In"
            message={`"It's been a month. How are you doing today? I'm here."`}
            onCopy={copyReminderTemplate}
          />
          <ReminderTemplate 
            title="Birthday or Anniversary Remembrance"
            message={`"Thinking of you today. I remember them with you."`}
            onCopy={copyReminderTemplate}
          />
          <ReminderTemplate 
            title="Holiday Support"
            message={`"The holidays can be bittersweet. How can I support you?"`}
            onCopy={copyReminderTemplate}
          />
        </div>
      </GlassCard>

      {/* Card 9: Find Help */}
      <GlassCard>
        <div className="flex items-start gap-4 mb-5">
          <div 
            className="p-3 rounded-xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2DB5A8 0%, #14b8a6 100%)',
              boxShadow: '0 4px 12px rgba(45, 181, 168, 0.3)'
            }}
          >
            <span className="text-2xl">🤝</span>
          </div>
          <h3 className="text-xl font-bold mt-2" style={{
            background: 'linear-gradient(135deg, #2DB5A8 0%, #14b8a6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Find Help
          </h3>
        </div>
        
        <div className="space-y-5 text-foreground/85">
          <p className="leading-relaxed text-base">
            Sometimes additional support is needed, and that's okay.
          </p>

          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 181, 168, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
              border: '1px solid rgba(45, 181, 168, 0.2)'
            }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#2DB5A8' }}>
              <span className="text-xl">🏛️</span>
              Local & Faith-Based Support
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>Church counseling or pastoral care</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>Local grief support groups</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#2DB5A8' }}>•</span>
                <span>Christian counselors or therapists</span>
              </li>
            </ul>
          </div>

          <div 
            className="p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(176, 140, 167, 0.08) 0%, rgba(155, 127, 184, 0.08) 100%)',
              border: '1px solid rgba(176, 140, 167, 0.2)'
            }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#B08CA7' }}>
              <span className="text-xl">🌐</span>
              Online Resources
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>Grief devotionals</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>Faith-based grief workshops</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lg" style={{ color: '#B08CA7' }}>•</span>
                <span>Audio prayers for comfort</span>
              </li>
            </ul>
          </div>

          <div 
            className="p-4 rounded-xl text-center italic text-base"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 181, 168, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
              border: '1px solid rgba(45, 181, 168, 0.3)'
            }}
          >
            Seeking help is a sign of courage, not weakness.
          </div>
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

function ActionButton({ icon, children, onClick }: { icon: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground transition-all hover:bg-white/30 active:scale-[0.98]"
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

function ReminderTemplate({ title, message, onCopy }: { title: string; message: string; onCopy: (message: string) => void }) {
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
          onClick={() => onCopy(message)}
          className="shrink-0 px-3 py-1.5 rounded text-xs font-medium text-white transition-all hover:bg-[#9A7890] active:scale-[0.98]"
          style={{ backgroundColor: '#B08CA7' }}
        >
          Copy Template
        </button>
      </div>
    </div>
  );
}
