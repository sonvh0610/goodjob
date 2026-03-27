import { AppIcon } from '../components/ui/AppIcon';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName =
    user?.displayName.trim().split(/\s+/)[0] && user.displayName.trim().length > 0
      ? user.displayName.trim().split(/\s+/)[0]
      : 'there';

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 md:py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">
              Hello, {firstName}! 👋
            </h1>
            <p className="text-on-surface-variant text-lg">
              You're doing an amazing job this month. Keep it up!
            </p>
          </div>
          <div className="flex gap-3">
            <span className="inline-flex items-center px-4 py-2 bg-tertiary-container text-on-tertiary-container rounded-full text-sm font-bold">
              <AppIcon
                className="material-symbols-outlined mr-2 text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </AppIcon>
              Top Contributor
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <section className="md:col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_40px_rgba(55,39,77,0.06)] flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <p className="text-on-surface-variant font-semibold uppercase tracking-wider text-xs mb-1">
                    Current Points Balance
                  </p>
                  <h2 className="text-6xl font-black text-primary tracking-tighter">
                    2,450{' '}
                    <span className="text-2xl text-primary-container font-bold">
                      pts
                    </span>
                  </h2>
                </div>
                <div className="bg-surface-container-high p-4 rounded-3xl">
                  <AppIcon
                    className="material-symbols-outlined text-primary text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    account_balance_wallet
                  </AppIcon>
                </div>
              </div>
              <div className="flex flex-wrap gap-12">
                <div>
                  <p className="text-on-surface-variant text-xs font-bold uppercase mb-2">
                    Giving Budget
                  </p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-bold text-on-surface">
                      140
                    </span>
                    <span className="text-on-surface-variant text-sm mb-1">
                      / 200 pts remaining
                    </span>
                  </div>
                  <div className="w-48 h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-secondary-container w-3/4 rounded-full"></div>
                  </div>
                </div>
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-on-surface-variant text-xs font-bold uppercase mb-1">
                      Received
                    </p>
                    <p className="text-2xl font-black text-on-surface">8</p>
                  </div>
                  <div className="text-center">
                    <p className="text-on-surface-variant text-xs font-bold uppercase mb-1">
                      Sent
                    </p>
                    <p className="text-2xl font-black text-on-surface">5</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="md:col-span-4 bg-gradient-to-br from-primary to-primary-dim rounded-xl p-8 text-on-primary shadow-xl shadow-primary/20 flex flex-col items-center justify-center text-center group">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md group-hover:scale-110 transition-transform">
              <AppIcon
                className="material-symbols-outlined text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                rocket_launch
              </AppIcon>
            </div>
            <h3 className="text-2xl font-bold mb-2">Recognize a Peer</h3>
            <p className="text-primary-container text-sm mb-8 px-4">
              Spotted someone doing a Good Job? Let the world know!
            </p>
            <button className="w-full bg-secondary-container text-on-secondary-container font-bold py-4 px-6 rounded-full hover:bg-secondary-fixed transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2">
              <AppIcon className="material-symbols-outlined text-xl">
                send
              </AppIcon>
              Send Kudos
            </button>
          </section>

          <section className="md:col-span-12 lg:col-span-4 bg-surface-container-low rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-on-surface">Points Activity</h3>
              <span className="text-xs font-bold text-tertiary flex items-center">
                <AppIcon className="material-symbols-outlined text-xs mr-1">
                  trending_up
                </AppIcon>
                +12% this month
              </span>
            </div>

            <div className="h-40 w-full flex items-end gap-2 px-2">
              <div className="flex-1 bg-primary-container/30 rounded-t-lg h-1/4"></div>
              <div className="flex-1 bg-primary-container/30 rounded-t-lg h-2/4"></div>
              <div className="flex-1 bg-primary-container/30 rounded-t-lg h-1/2"></div>
              <div className="flex-1 bg-primary-container/30 rounded-t-lg h-2/3"></div>
              <div className="flex-1 bg-primary rounded-t-lg h-5/6 shadow-lg shadow-primary/20"></div>
              <div className="flex-1 bg-primary-container/30 rounded-t-lg h-3/4"></div>
              <div className="flex-1 bg-primary-container/30 rounded-t-lg h-full"></div>
            </div>
            <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </section>

          <section className="md:col-span-12 lg:col-span-8 bg-white/40 rounded-xl p-1">
            <div className="p-6 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-lg text-on-surface">
                Recent Recognition
              </h3>
              <a
                className="text-primary text-sm font-bold hover:underline"
                href="#"
              >
                View All Feed
              </a>
            </div>
            <div className="space-y-4 p-4">
              <div className="bg-surface-container-lowest rounded-2xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                  <img
                    alt="Avatar"
                    data-alt="close-up portrait of a woman with curly hair and a joyful expression wearing a yellow sweater in soft studio lighting"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjT8YO8y0Xyhk94pXZ0efmhmPE1VY7MQaX2pc8TsS1NGJOLhh5HAONj-ivQb57ER0oK5XbN7o5YwKVLQ7f19-kq0EGR-AVt41-MXg-UP-MpxstdlNFKLxXIag65iMHp5xdQJysHOWI8UWU1nRYhS4xhP5A6boaYvgXXrQHVS4OvA4ORO-i_jInzhhIcMK24zhC4JjRWVaqg7m4h0k26wwC3xIYuSeDsA-r2sdZe_DZ82R3BtiMqoTazEh2wLVkFrdCMGkNX_v0wCZ1"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">
                    <span className="font-bold">Sarah Jenkins</span> gave kudos
                    to <span className="font-bold">You</span>
                  </p>
                  <p className="text-on-surface-variant text-sm line-clamp-1 italic">
                    "Amazing work on the quarterly report, Alex! Your attention
                    to detail is unmatched."
                  </p>
                </div>
                <div className="bg-primary-container/20 px-3 py-1 rounded-full shrink-0">
                  <span className="text-xs font-bold text-primary">
                    +50 pts
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                  <img
                    alt="Avatar"
                    data-alt="professional portrait of a man with glasses and a friendly smile wearing a dark polo shirt against a neutral grey background"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPj2RzvqwwXIl2Ag_6ZCi7PKym7WrUz16vubpjXjLDx-PfGV7eH6mqHtY_VOjQD8HxjemDn5SeQTL5QrAwtLgf1JhU1AStfCpO3U6et2iR-GU8tyUsJO0XCFu8QoA9H0AO9d6BTeg18g1Ottu595rCBkRvRAujvSdgBEYq_54YO9ApTzV_JDAJ-L_ER5UNg9l1j2yqsqezPT9WM8NA4Vf3O2mFzEgs6MYCVi5V4EoivwLCCgSbftXf1wyr1pBZSqgBDiWf-0tWh8SE"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">
                    <span className="font-bold">David Chen</span> recognized{' '}
                    <span className="font-bold">Liam Smith</span>
                  </p>
                  <p className="text-on-surface-variant text-sm line-clamp-1 italic">
                    "Great teamwork on the client pitch today. We crushed it!"
                  </p>
                </div>
                <div className="text-xs text-on-surface-variant font-medium shrink-0">
                  2h ago
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                  <img
                    alt="Avatar"
                    data-alt="man with a beard and short hair smiling looking slightly off-camera with a clean white wall behind him"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeyZH30TyLRaetL83dEHSLMw_T1OED6vustr87hCg0wOSSAi2JzCNkRUca4gmupSKQWEaG9J_1I1CqqEVJm7U2pHR1XXlJPRA7008vZt3tuELwuaKzzE8qqjcaShTgQ-EeBpycf5t6HuJyRxthLynDoDpCJPgipYkgwx02vJuFa_hC-FKo1Be5JEv9GkJP6schyOhhuDKm4bpskAADbqonrx2CUszMF2JMEtqOIut2G0ezatpbUYjhzlVvESvjzDNBZCOp6Gm2ZRaf"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">
                    <span className="font-bold">Marcus Roe</span> gave kudos to{' '}
                    <span className="font-bold">You</span>
                  </p>
                  <p className="text-on-surface-variant text-sm line-clamp-1 italic">
                    "Thanks for helping me troubleshoot that server issue after
                    hours."
                  </p>
                </div>
                <div className="bg-primary-container/20 px-3 py-1 rounded-full shrink-0">
                  <span className="text-xs font-bold text-primary">
                    +25 pts
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="md:col-span-12 bg-surface-container-low rounded-[3rem] p-8 md:p-12 mt-4 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
              <div>
                <h2 className="text-3xl font-black text-on-surface tracking-tight mb-2">
                  Featured Rewards
                </h2>
                <p className="text-on-surface-variant">
                  Treat yourself! You've earned it.
                </p>
              </div>
              <button className="bg-white text-on-surface font-bold py-3 px-8 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 self-start">
                Visit Rewards Store
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 group transition-all hover:-translate-y-2">
                <div className="h-48 relative overflow-hidden">
                  <img
                    alt="Coffee Gift Card"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    data-alt="aesthetic close-up of a steaming latte with heart-shaped foam art on a rustic wooden table with coffee beans"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAilebbtmN33xnmSahdRopjGXGCffxxwg3sto5SIJXH62eilhQ2l-v3f2eotWQqqMzyG-CUUy7l20Y67MiFhP84bJEtlbIV4Y7lxMBQaKsrF3bDvhuVcKiyOkQY57X9IWEXNOnqqbzpZDN9SY2ppAuytrFPTNLbvCX10x0L5E4BiDTvMgVFcr9Hx8y3F8BI_R10lA9DpHYsWmxA-PnhQo3-ghoy4Y48po54qX8bMn3ZWN5OLsMHJOp5Y0UI08cxYt5qZFvGzcOvgkpR"
                  />
                  <div className="absolute top-4 right-4 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-black">
                    POPULAR
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-bold text-lg mb-1">
                    Premium Coffee Card
                  </h4>
                  <p className="text-on-surface-variant text-xs mb-4">
                    A \$25 gift card for your favorite morning brew.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-black">500 pts</span>
                    <button className="p-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-full transition-colors">
                      <AppIcon className="material-symbols-outlined">
                        add_shopping_cart
                      </AppIcon>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 group transition-all hover:-translate-y-2">
                <div className="h-48 relative overflow-hidden">
                  <img
                    alt="Tech Gadget"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    data-alt="sleek modern wireless headphones in matte black resting on a minimalist desk with soft dramatic lighting"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD58xainX4Uy530PwCNUIEeASbYl4WgxLYaaL9sSs_CPGk5YzMlEelzn_w2D_DgCPxhsxb_oYYbYyDbVVfV7ysf5T7TeGiXkPMV63s_9D5e0gHRI4mIVUxIhXcI1qVcTWyXpT2hxiCYe-J-UhAGknCoTe7J1WDlEZXqCD2tmp8n0rwhID6RN31rCTl7E9Sl-ekGbnDij6-EylZbitHh8468Yf2_zy6FxVHUWZuTOL_tiQRXYSvotaYOwDEBzoq0Lseuf5mti2LLp8A"
                  />
                </div>
                <div className="p-6">
                  <h4 className="font-bold text-lg mb-1">
                    Wireless Noise Cancelling
                  </h4>
                  <p className="text-on-surface-variant text-xs mb-4">
                    Focus anywhere with top-tier audio quality.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-black">5,000 pts</span>
                    <button className="p-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-full transition-colors">
                      <AppIcon className="material-symbols-outlined">
                        add_shopping_cart
                      </AppIcon>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 group transition-all hover:-translate-y-2 lg:flex flex-col hidden">
                <div className="h-48 relative overflow-hidden">
                  <img
                    alt="Extra Day Off"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    data-alt="peaceful beach scene at sunset with calm turquoise water and golden sand under a soft pastel sky"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8_i-0zGo7f86pY9CoyGP6j-HBralp5gUhcfpGmXU2EMEw4yrxqsdOTpVP34C5RvJ0WUKc0ogm0kGoBFKRYgvmdVq8KbLkqlZLD0hcq9MDHVFOmK6ac7pzArB5LX8EZeJN8Bu0XeMhoj76sg3F8p5Di-nOM5IsIDC-OuZMueIlvD7dcdmj08iYwPwKq2MyfQz_-eHKytVhPQZndVPt9mnzEBKEi2I2AjEZ4DRw01Qiqqow0z6WDr2vul_jvv9AiFL6SRTjNhhQ7_7v"
                  />
                </div>
                <div className="p-6">
                  <h4 className="font-bold text-lg mb-1">Extra Day Off</h4>
                  <p className="text-on-surface-variant text-xs mb-4">
                    Redeem for a well-deserved personal day.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-black">10,000 pts</span>
                    <button className="p-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-full transition-colors">
                      <AppIcon className="material-symbols-outlined">
                        add_shopping_cart
                      </AppIcon>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full -ml-48 -mb-48"></div>
          </section>
        </div>
      </div>
    </div>
  );
}
