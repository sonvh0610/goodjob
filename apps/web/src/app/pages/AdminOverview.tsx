import { AppIcon } from '../components/ui/AppIcon';

export default function AdminOverview() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 md:py-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-background mb-2">
                Admin Overview
              </h1>
              <p className="text-on-surface-variant font-body">
                Real-time engagement analytics and reward management.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-secondary-fixed/40 bg-secondary text-on-secondary font-semibold hover:bg-secondary-fixed transition-all">
                <AppIcon
                  className="material-symbols-outlined text-[20px]"
                  data-icon="download"
                >
                  download
                </AppIcon>
                Export PDF
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary font-semibold shadow-lg shadow-primary/30 hover:bg-primary-dim hover:scale-[1.02] active:scale-95 transition-all">
                <AppIcon
                  className="material-symbols-outlined text-[20px]"
                  data-icon="add"
                >
                  add
                </AppIcon>
                Create Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_12px_40px_rgba(55,39,77,0.04)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary-container rounded-2xl">
                  <AppIcon
                    className="material-symbols-outlined text-on-primary-container"
                    data-icon="favorite"
                  >
                    favorite
                  </AppIcon>
                </div>
                <span className="text-tertiary font-bold text-sm bg-tertiary-container/30 px-2 py-1 rounded-lg">
                  +12.5%
                </span>
              </div>
              <div>
                <p className="text-on-surface-variant text-sm font-medium">
                  Total Kudos this Month
                </p>
                <h3 className="text-3xl font-headline font-bold text-on-background">
                  2,842
                </h3>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_12px_40px_rgba(55,39,77,0.04)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary-container rounded-2xl">
                  <AppIcon
                    className="material-symbols-outlined text-on-secondary-container"
                    data-icon="shopping_bag"
                  >
                    shopping_bag
                  </AppIcon>
                </div>
                <span className="text-error font-bold text-sm bg-error-container/20 px-2 py-1 rounded-lg">
                  -2.1%
                </span>
              </div>
              <div>
                <p className="text-on-surface-variant text-sm font-medium">
                  Redemption Rate
                </p>
                <h3 className="text-3xl font-headline font-bold text-on-background">
                  64.8%
                </h3>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_12px_40px_rgba(55,39,77,0.04)] col-span-1 md:col-span-2">
              <p className="text-on-surface-variant text-sm font-medium mb-4">
                Most Used Core Values
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-container/40 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-sm font-bold text-primary">
                    Teamwork
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    840
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-container/30 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-sm font-bold text-primary">
                    Innovation
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    612
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-container/25 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-sm font-bold text-primary">
                    Integrity
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    429
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-container/20 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-sm font-bold text-primary">
                    Excellence
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    388
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-surface-container-low rounded-xl p-8 border border-white/40">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-xl font-headline font-bold">
                    Engagement Over Time
                  </h4>
                  <p className="text-sm text-on-surface-variant">
                    Daily kudos interaction for current month
                  </p>
                </div>
                <select className="bg-white/50 border-none rounded-full px-4 text-sm font-semibold focus:ring-primary/30">
                  <option>Last 30 Days</option>
                  <option>Last 3 Months</option>
                </select>
              </div>

              <div className="relative h-64 flex items-end gap-3 px-2">
                <div className="flex-1 bg-primary/10 rounded-t-lg h-[40%] hover:bg-primary/20 transition-all"></div>
                <div className="flex-1 bg-primary/10 rounded-t-lg h-[65%] hover:bg-primary/20 transition-all"></div>
                <div className="flex-1 bg-primary/10 rounded-t-lg h-[55%] hover:bg-primary/20 transition-all"></div>
                <div className="flex-1 bg-primary/10 rounded-t-lg h-[80%] hover:bg-primary/20 transition-all"></div>
                <div className="flex-1 bg-primary/30 rounded-t-lg h-[90%] hover:bg-primary/40 transition-all"></div>
                <div className="flex-1 bg-primary/20 rounded-t-lg h-[70%] hover:bg-primary/30 transition-all"></div>
                <div className="flex-1 bg-primary/10 rounded-t-lg h-[45%] hover:bg-primary/20 transition-all"></div>
                <div className="flex-1 bg-primary/40 rounded-t-lg h-[95%] hover:bg-primary/50 transition-all"></div>
                <div className="flex-1 bg-primary/20 rounded-t-lg h-[60%] hover:bg-primary/30 transition-all"></div>
                <div className="flex-1 bg-primary/60 rounded-t-lg h-[85%] hover:bg-primary/70 transition-all"></div>
                <div className="flex-1 bg-primary/20 rounded-t-lg h-[50%] hover:bg-primary/30 transition-all"></div>
                <div className="flex-1 bg-primary/10 rounded-t-lg h-[30%] hover:bg-primary/20 transition-all"></div>
              </div>
              <div className="flex justify-between mt-4 px-2 text-xs font-bold text-on-surface-variant/60">
                <span>WEEK 1</span>
                <span>WEEK 2</span>
                <span>WEEK 3</span>
                <span>WEEK 4</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(55,39,77,0.04)]">
              <h4 className="text-xl font-headline font-bold mb-6">
                Star Employees
              </h4>
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      alt="Top Employee"
                      className="w-12 h-12 rounded-full object-cover"
                      data-alt="Close up portrait of a young professional woman with brown wavy hair, smiling warmly in a bright office setting"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUCMFSbEon8UJvidPvfQIGAcdkWdOoFbDijO_OVrfoy7YTs2MgQmERgN8UoSMZwTp-bqoKKCLAOb--emZljvQLXUJlX6zbBKrXQ8hOTIAqqsLHOuNC7r1EMz2P22TNzVXrW-mA3NuVrKG7AxNt9jCWj47vaeTXkIUXZ6YC21ab2VvAJnuOE7CPPkFEdI_GeMmtqzoqvt7yCJxNZ8DyvYtZWRLCanmo-DmIxC5HGS3YjQce6_DhwLOftmQhi2VVaPQt20XHtP0ncSmh"
                    />
                    <div>
                      <p className="font-bold text-on-surface">
                        Elena Rodriguez
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Design Lead
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">42</p>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-tighter">
                      Kudos
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      alt="Top Employee"
                      className="w-12 h-12 rounded-full object-cover"
                      data-alt="Portrait of a young man with glasses and a friendly expression, wearing a navy polo shirt, natural daylight"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9YxGNjQnDdfJFHnxyQ-W1RjIcByoQuJYOeXGCDA2o9ggLC9LJyPoPPnsMqlHtqkh-hyyyU08JJhGHWNE3toQWkQ6-wvODIhD830xT5xYa8PtFAtznIY_6VkMAcUkc934UH6RWNjrPfWGOvPIVnTGa4evAutLNhU0xOlHEcwm1x3_pWlrctPqNFYi85M2ap_Og6S4yyR3rIM8oa1ZYBNJOSUtv0gh4kpKjOmjcjtnu3zR0YQKJdXH1SvdmNVfKmzTgKF4NRCXeKWvm"
                    />
                    <div>
                      <p className="font-bold text-on-surface">Marcus Chen</p>
                      <p className="text-xs text-on-surface-variant">
                        Senior Dev
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">38</p>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-tighter">
                      Kudos
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      alt="Top Employee"
                      className="w-12 h-12 rounded-full object-cover"
                      data-alt="Professional woman of color in business attire, confident smile, blurred workspace background"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4E1pRPUFySBYAJfX_Xf0onVxmFGDPDetJU7mudzmDMXr7eJVWtS4VV5fW8GLRhQL0kivlJaQ1w2mPvarbqsh4XuTp03y6NbL1a3VVx_GUou1FZa7wJPMabkpAZ8xr6EDk7vRXTXCv4d6IBE-E-fpeozJaIl-hiJTGSmrORMaXcqMtkRnd9nuPVwS95BU9o7YUTtJX5DJMNjYMBXxzCZ4XeJToai3Io2yRPNm6OfEyOutfpadM1yqyvqR8nnMH1YNTU27d7-731s60"
                    />
                    <div>
                      <p className="font-bold text-on-surface">Sarah Jenkins</p>
                      <p className="text-xs text-on-surface-variant">
                        HR Manager
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">35</p>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-tighter">
                      Kudos
                    </p>
                  </div>
                </div>
                <button className="mt-2 text-sm font-bold text-primary hover:underline transition-all">
                  View all leaderboards →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(55,39,77,0.04)]">
            <div className="p-6 border-b border-surface-container flex justify-between items-center">
              <h4 className="text-xl font-headline font-bold">
                Recent Reward Redemptions
              </h4>
              <button className="p-2 hover:bg-surface-container rounded-full transition-all">
                <AppIcon
                  className="material-symbols-outlined"
                  data-icon="filter_list"
                >
                  filter_list
                </AppIcon>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-on-surface-variant font-bold text-xs uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Reward</th>
                    <th className="px-6 py-4">Points</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  <tr className="hover:bg-surface-container-lowest transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-container/40 flex items-center justify-center font-bold text-xs text-primary">
                          JB
                        </div>
                        <span className="font-semibold text-sm">
                          Jordan Bell
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      Starbucks \$25 Gift Card
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">
                      2,500 pts
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      Oct 24, 2023
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-tertiary-container/30 text-tertiary text-xs font-bold rounded-full">
                        Fulfilled
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-lowest transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center font-bold text-xs text-secondary">
                          AL
                        </div>
                        <span className="font-semibold text-sm">Anita Lee</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      Extra Day Off
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">
                      10,000 pts
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      Oct 23, 2023
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary-container/30 text-primary text-xs font-bold rounded-full">
                        Processing
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-lowest transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary-container/25 flex items-center justify-center font-bold text-xs text-secondary">
                          TW
                        </div>
                        <span className="font-semibold text-sm">
                          Tom Wilson
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      Noise Cancelling Headphones
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">
                      15,000 pts
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      Oct 22, 2023
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-tertiary-container/30 text-tertiary text-xs font-bold rounded-full">
                        Fulfilled
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-surface-container-low text-center">
              <button className="text-sm font-bold text-on-surface-variant hover:text-primary transition-all">
                View Full Transaction History
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-primary to-primary-dim rounded-3xl p-8 text-on-primary relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-2xl font-headline font-bold mb-2">
                  Manage Rewards Store
                </h4>
                <p className="text-primary-container mb-6 max-w-xs">
                  Update your catalog, change pricing, and add new celebratory
                  items.
                </p>
                <button className="px-6 py-3 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-dim transition-all flex items-center gap-2">
                  Go to Store Management
                  <AppIcon
                    className="material-symbols-outlined"
                    data-icon="arrow_forward"
                  >
                    arrow_forward
                  </AppIcon>
                </button>
              </div>

              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              <AppIcon
                className="absolute top-8 right-8 material-symbols-outlined text-6xl text-white/10"
                data-icon="inventory_2"
              >
                inventory_2
              </AppIcon>
            </div>
            <div className="bg-surface-container rounded-3xl p-8 flex flex-col justify-between border-2 border-dashed border-outline-variant/30">
              <div>
                <h4 className="text-xl font-headline font-bold mb-2">
                  Automated Rules
                </h4>
                <p className="text-on-surface-variant text-sm mb-6">
                  Set up automatic kudos for birthdays, anniversaries, or
                  reaching sales targets.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AppIcon
                        className="material-symbols-outlined text-primary"
                        data-icon="cake"
                      >
                        cake
                      </AppIcon>
                      <span className="text-sm font-semibold">
                        Birthday Bonus
                      </span>
                    </div>
                    <div className="w-10 h-6 bg-tertiary rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AppIcon
                        className="material-symbols-outlined text-primary"
                        data-icon="work_history"
                      >
                        work_history
                      </AppIcon>
                      <span className="text-sm font-semibold">
                        1 Year Anniversary
                      </span>
                    </div>
                    <div className="w-10 h-6 bg-tertiary rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <button className="mt-6 text-sm font-bold text-primary flex items-center gap-2">
                Configure Automation
                <AppIcon
                  className="material-symbols-outlined text-[18px]"
                  data-icon="settings"
                >
                  settings
                </AppIcon>
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
