import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            CallVia
          </h1>
          <p className="text-2xl text-gray-600 mb-4">
            AI-Powered Appointment Setting for Life Insurance Agents
          </p>
          <p className="text-lg text-gray-500 mb-12">
            Automate your outbound calling, book appointments, and track performance with our all-in-one platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mb-16">
            <Link href="/dashboard">
              <Button size="lg">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" size="lg">
                Login
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Calling</h3>
              <p className="text-gray-600">
                Retell AI makes intelligent outbound calls and books appointments automatically.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">
                Cal.com integration with automated reminders and show rate tracking.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Performance Billing</h3>
              <p className="text-gray-600">
                Pay $0.20/minute + $2,000 per 25 shown appointments with Stripe.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mt-16">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-3xl font-bold text-blue-600">60%+</div>
              <div className="text-gray-600">Show Rate</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-3xl font-bold text-green-600">24/7</div>
              <div className="text-gray-600">AI Calling</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-3xl font-bold text-purple-600">Auto</div>
              <div className="text-gray-600">Reminders</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-3xl font-bold text-orange-600">Real-time</div>
              <div className="text-gray-600">Analytics</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
