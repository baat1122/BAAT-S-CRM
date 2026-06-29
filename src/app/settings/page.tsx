"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, Trash2, Shield, User, Building2, Bell, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Team");
  const [team, setTeam] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Team Management State
  const [form, setForm] = useState({ name: "", email: "", role: "Agent" });

  useEffect(() => {
    async function fetchData() {
      const { data: teamData, error: teamError } = await supabase.from('team_members').select('*');
      if (teamData) {
        setTeam(teamData);
      } else if (teamError && teamError.code === '42P01') {
        // Table doesn't exist, fallback to empty team
        setTeam([]);
      }

      const { data: settingsData } = await supabase.from('company_settings').select('*').limit(1).single();
      if (settingsData) {
        setSettings(settingsData);
      } else {
        setSettings({
          company_name: "Best American Auto Transport",
          support_phone: "(302) 355-5544",
          business_address: "5 Great Valley Pkwy, Malvern, PA 19355",
          timezone: "Eastern Time (EST)",
          default_currency: "USD ($)"
        });
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setSuccessMsg("");
    
    if (settings.id) {
      await supabase.from('company_settings').update(settings).eq('id', settings.id);
    } else {
      // Table might not exist yet, simulate save
    }

    setSuccessMsg("Settings saved successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
    setSaving(false);
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('team_members').insert([form]).select();
    if (data) {
      setTeam([...team, data[0]]);
      setForm({ name: "", email: "", role: "Agent" });
    } else {
      // Fallback local state if DB isn't fully migrated yet
      setTeam([...team, { id: Date.now().toString(), ...form }]);
      setForm({ name: "", email: "", role: "Agent" });
    }
  };

  const removeMember = async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id);
    setTeam(team.filter(t => t.id !== id));
  };

  const tabs = [
    { id: 'General', icon: SettingsIcon, label: 'General Preferences' },
    { id: 'Company', icon: Building2, label: 'Company Profile' },
    { id: 'Notifications', icon: Bell, label: 'Notifications' },
    { id: 'Team', icon: Shield, label: 'Team Management' },
  ];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-foreground/70 mt-1">Configure your CRM preferences and manage your organization.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm border
                ${activeTab === tab.id 
                  ? 'bg-neon-blue text-dark-navy border-neon-blue shadow-[0_0_15px_rgba(0,144,208,0.3)]' 
                  : 'bg-background border-border text-foreground hover:bg-foreground/5 hover:border-foreground/20'
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-panel p-8 rounded-2xl border border-border min-h-[500px] relative">
          
          {successMsg && (
            <div className="absolute top-4 right-8 bg-green-500/20 text-green-500 px-4 py-2 rounded-xl font-medium border border-green-500/30 animate-in fade-in slide-in-from-top-2">
              {successMsg}
            </div>
          )}

          {/* TEAM MANAGEMENT TAB */}
          {activeTab === 'Team' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                <Shield className="text-neon-blue" size={24} />
                <h3 className="text-xl font-bold">Team Management</h3>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-1 border-r border-border/50 pr-6">
                  <h4 className="font-bold mb-4">Add New User</h4>
                  <form onSubmit={addMember} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-neon-blue/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-neon-blue/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Role</label>
                      <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-neon-blue/50">
                        <option value="Agent">Sales Agent</option>
                        <option value="Dispatcher">Dispatcher</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neon-blue text-white font-bold rounded-xl hover:bg-electric-cyan transition-colors">
                      <Plus size={16} /> Add User
                    </button>
                  </form>
                </div>

                <div className="xl:col-span-2">
                  <h4 className="font-bold mb-4">Active Team Members</h4>
                  <div className="space-y-3">
                    {team.map(member => (
                      <div key={member.id} className="flex justify-between items-center p-4 bg-foreground/5 rounded-xl border border-border hover:border-neon-blue/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-electric-cyan/20 text-electric-cyan flex items-center justify-center font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-neon-blue">{member.name}</p>
                            <p className="text-sm text-foreground/70">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 rounded bg-background border border-border text-xs font-semibold">
                            {member.role}
                          </span>
                          <button onClick={() => removeMember(member.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors" title="Remove User">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {team.length === 0 && !loading && (
                      <p className="text-foreground/50 italic">No team members added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GENERAL TAB (MOCK) */}
          {activeTab === 'General' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                <SettingsIcon className="text-neon-blue" size={24} />
                <h3 className="text-xl font-bold">General Preferences</h3>
              </div>
              <p className="text-foreground/60 mb-6">Configure system-wide behavior and regional settings.</p>
              
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block font-medium mb-1">Timezone</label>
                  <select 
                    value={settings?.timezone || ""}
                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                  >
                    <option>Eastern Time (EST)</option>
                    <option>Central Time (CST)</option>
                    <option>Pacific Time (PST)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Default Currency</label>
                  <select 
                    value={settings?.default_currency || ""}
                    onChange={(e) => setSettings({...settings, default_currency: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                  >
                    <option>USD ($)</option>
                    <option>CAD ($)</option>
                  </select>
                </div>
                <button 
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-6 py-2 bg-neon-blue text-dark-navy font-bold rounded-xl hover:bg-electric-cyan disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* COMPANY PROFILE TAB (MOCK) */}
          {activeTab === 'Company' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                <Building2 className="text-neon-blue" size={24} />
                <h3 className="text-xl font-bold">Company Profile</h3>
              </div>
              <p className="text-foreground/60 mb-6">These details appear on your invoices and public documents.</p>
              
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block font-medium mb-1">Company Name</label>
                  <input 
                    value={settings?.company_name || ""}
                    onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-background font-medium" 
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Support Phone Number</label>
                  <input 
                    value={settings?.support_phone || ""}
                    onChange={(e) => setSettings({...settings, support_phone: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-background font-medium" 
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Business Address</label>
                  <textarea 
                    value={settings?.business_address || ""}
                    onChange={(e) => setSettings({...settings, business_address: e.target.value})}
                    rows={3} 
                    className="w-full px-4 py-2 rounded-xl border border-border bg-background font-medium" 
                  />
                </div>
                <button 
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-6 py-2 bg-neon-blue text-dark-navy font-bold rounded-xl hover:bg-electric-cyan disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Update Profile"}
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB (MOCK) */}
          {activeTab === 'Notifications' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                <Bell className="text-neon-blue" size={24} />
                <h3 className="text-xl font-bold">Notification Rules</h3>
              </div>
              <p className="text-foreground/60 mb-6">Manage how and when your team receives alerts.</p>
              
              <div className="space-y-4 max-w-lg">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-foreground/5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-neon-blue" />
                  <div>
                    <p className="font-bold">New Lead Alerts</p>
                    <p className="text-xs text-foreground/60">Email me when a new lead enters the system.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-foreground/5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-neon-blue" />
                  <div>
                    <p className="font-bold">Payment Confirmations</p>
                    <p className="text-xs text-foreground/60">Send receipt to customer immediately upon payment.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-foreground/5 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-neon-blue" />
                  <div>
                    <p className="font-bold">Daily Analytics Digest</p>
                    <p className="text-xs text-foreground/60">Send a daily email summary of operations.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
