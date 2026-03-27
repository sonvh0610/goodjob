import { useQuery } from '@tanstack/react-query';
import { Link, Route, Routes } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

async function getApiHealth() {
  const response = await fetch('/api');
  if (!response.ok) {
    throw new Error('API is unreachable');
  }
  return response.text();
}

export function App() {
  const healthQuery = useQuery({
    queryKey: ['api-health'],
    queryFn: getApiHealth,
    staleTime: 30_000,
  });

  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen p-6 md:p-10 bg-[#f8fafc]">
          <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl bg-white/85 p-6 shadow-xl ring-1 ring-slate-200 backdrop-blur md:p-8">
            <header className="space-y-2">
              <p className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Amanotes Kudos MVP
              </p>
              <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                Web app scaffold is ready with React, Tailwind, and React Query.
              </h1>
              <p className="text-sm text-slate-600 md:text-base">
                Next step is building kudos creation, live feed, and rewards flow
                from the case study plan.
              </p>
            </header>

            <section className="grid gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 md:grid-cols-3">
              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Frontend
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  React + TypeScript
                </p>
              </div>
              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  State Fetching
                </p>
                <p className="mt-1 font-semibold text-slate-800">React Query</p>
              </div>
              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Styling
                </p>
                <p className="mt-1 font-semibold text-slate-800">Tailwind CSS</p>
              </div>
            </section>

            <section className="rounded-2xl bg-slate-900 p-4 text-slate-100">
              <p className="text-xs uppercase tracking-wider text-slate-300">
                API health check
              </p>
              <p className="mt-2 text-sm">
                {healthQuery.isPending && 'Checking backend connection...'}
                {healthQuery.isError &&
                  'Backend is not reachable yet. Start the API app to verify.'}
                {healthQuery.isSuccess && `API response: ${healthQuery.data}`}
              </p>
            </section>

            <nav
              className="flex items-center gap-4 text-sm font-medium text-indigo-700"
              role="navigation"
            >
              <Link className="hover:text-indigo-900 hover:underline" to="/">
                Home
              </Link>
              <Link
                className="hover:text-indigo-900 hover:underline"
                to="/planning"
              >
                Planning
              </Link>
              <Link
                className="hover:text-indigo-900 hover:underline"
                to="/login"
              >
                Login
              </Link>
              <Link
                className="hover:text-indigo-900 hover:underline"
                to="/register"
              >
                Register
              </Link>
            </nav>
          </main>
        </div>
      } />
      <Route
        path="/planning"
        element={<div className="sr-only">Planning route</div>}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
