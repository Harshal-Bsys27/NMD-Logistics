'use client';

import { useState } from 'react';
import { ChevronDown, Search, Package, Truck, Users, BarChart3, Settings, Bell, BookOpen } from 'lucide-react';
import Link from 'next/link';

const helpSections = [
  {
    icon: Package,
    title: 'Orders',
    description: 'Manage delivery orders and track their status',
    topics: [
      { title: 'Creating New Orders', content: 'Navigate to Orders > New Order. Fill in pickup/delivery locations, package details, and priority level. Click Save to create the order.' },
      { title: 'Tracking Orders', content: 'View real-time order status in the Orders dashboard. Filter by status or search by order number. Click on any order to see detailed information.' },
      { title: 'Editing Orders', content: 'Only draft orders can be edited. Click on the order and use the Edit Form to make changes. Confirmed orders require support assistance.' },
      { title: 'Order Statuses', content: 'Draft → Confirmed → Assigned → Picked Up → In Transit → Delivered. Failed and Cancelled are terminal states.' },
    ],
  },
  {
    icon: Truck,
    title: 'Drivers & Fleet',
    description: 'Manage drivers and track their performance',
    topics: [
      { title: 'Adding Drivers', content: 'Admin only. Navigate to Drivers section. Add driver details including vehicle info, license, and contact information.' },
      { title: 'Driver Performance', content: 'Track ratings, completed deliveries, and efficiency scores. View historical assignments and customer feedback.' },
      { title: 'Availability Status', content: 'Drivers can update status: Available, On Delivery, On Break, Off Duty. Real-time status updates for optimal assignment.' },
      { title: 'Vehicle Management', content: 'Each driver is assigned a vehicle. Track vehicle type, number, insurance, and maintenance schedules.' },
    ],
  },
  {
    icon: Users,
    title: 'Assignments',
    description: 'Real-time job assignments and tracking',
    topics: [
      { title: 'Creating Assignments', content: 'System auto-suggests drivers based on location, availability, and rating. Manually assign or accept suggestions.' },
      { title: 'Assignment Flow', content: 'Pending → Accepted → In Progress → Completed. Drivers can accept/reject via app notifications.' },
      { title: 'Route Optimization', content: 'System considers location, traffic, and driver capacity to optimize routes and reduce delivery time.' },
      { title: 'Real-time Tracking', content: 'Track live location of drivers. View ETA and route details. Customers get real-time updates.' },
    ],
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'View performance metrics and insights',
    topics: [
      { title: 'Order Analytics', content: 'Track order trends, success rates, and average delivery times. View revenue and profit metrics.' },
      { title: 'Driver Performance', content: 'Compare driver ratings, efficiency scores, and completion rates. Identify top performers.' },
      { title: 'Fleet Insights', content: 'Monitor fleet utilization, cost per delivery, and vehicle maintenance needs.' },
      { title: 'Custom Reports', content: 'Generate reports by date range, driver, customer, or route. Export data in CSV format.' },
    ],
  },
  {
    icon: Settings,
    title: 'Settings',
    description: 'Configure workspace and preferences',
    topics: [
      { title: 'Profile Settings', content: 'Update your name, email, and timezone. These settings affect notifications and reports.' },
      { title: 'Notifications', content: 'Control order updates, assignment notifications, and daily summaries. All preferences are saved locally.' },
      { title: 'Security', content: 'Change password, enable two-factor authentication (coming soon), and manage API keys.' },
      { title: 'Integrations', content: 'Connect with payment providers and courier APIs. Configure webhooks for real-time updates.' },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left"
    >
      <div className="surface-glass rounded-xl border border-slate-700/50 p-4 transition hover:border-slate-600/50">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-white">{question}</h4>
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          />
        </div>
        {open && <p className="mt-3 text-slate-300">{answer}</p>}
      </div>
    </button>
  );
}

export default function HelpPage() {
  const [selectedSection, setSelectedSection] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const currentSection = helpSections[selectedSection];
  const CurrentIcon = currentSection.icon;

  const faqs = [
    { q: 'How do I reset my password?', a: 'Contact your admin. Password reset via email coming soon.' },
    { q: 'Can I bulk import orders?', a: 'Yes! Use the Import Orders feature in the Orders menu to upload a CSV file.' },
    { q: 'How are drivers assigned to orders?', a: 'The system automatically selects the best driver based on location, availability, rating, and current load.' },
    { q: 'What formats do reports support?', a: 'Reports can be exported as PDF, CSV, or Excel. Custom date ranges and filters are supported.' },
    { q: 'Is mobile tracking real-time?', a: 'Yes! GPS updates every 10 seconds. Battery optimizations available in driver app settings.' },
    { q: 'How do I contact support?', a: 'Email: support@nmdlogistics.com | Phone: 1-800-NMD-HELP | Chat: Available 9 AM - 6 PM IST' },
  ];

  const filteredSections = helpSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/20 p-3">
              <BookOpen className="h-8 w-8 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Help & Support</h1>
              <p className="mt-1 text-slate-400">Find answers and learn how to use NMD Logistics</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-12 py-3 text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="space-y-3 lg:col-span-1">
            {filteredSections.map((section, index) => {
              const Icon = section.icon;
              const actualIndex = helpSections.indexOf(section);
              return (
                <button
                  key={index}
                  onClick={() => setSelectedSection(actualIndex)}
                  className={`surface-glass w-full rounded-xl border p-4 text-left transition ${
                    selectedSection === actualIndex
                      ? 'border-cyan-500/50 bg-cyan-500/10'
                      : 'border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-cyan-300" />
                    <div>
                      <h3 className="font-semibold text-white">{section.title}</h3>
                      <p className="text-xs text-slate-400">{section.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="space-y-6 lg:col-span-2">
            <div className="surface-glass rounded-2xl border border-slate-700/50 p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/20 p-3">
                  <CurrentIcon className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{currentSection.title}</h2>
                  <p className="text-slate-400">{currentSection.description}</p>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-700/50 pt-6">
                {currentSection.topics.map((topic, i) => (
                  <div key={i}>
                    <h4 className="font-semibold text-white">{topic.title}</h4>
                    <p className="mt-2 text-slate-300">{topic.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="mt-2 text-slate-400">Quick answers to common questions</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="surface-glass rounded-2xl border border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Need more help?</h3>
              <p className="mt-1 text-slate-400">Our support team is available 24/7</p>
            </div>
            <div className="flex gap-3">
              <a
                href="mailto:support@nmdlogistics.com"
                className="rounded-xl bg-slate-800/50 px-6 py-3 font-semibold text-slate-300 transition hover:bg-slate-700/50"
              >
                Email Support
              </a>
              <a
                href="tel:+18009996343"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-600 hover:to-blue-600"
              >
                Call Us
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Documentation', href: '/docs', icon: '📚' },
            { title: 'Status Page', href: '/status', icon: '📊' },
            { title: 'API Reference', href: '/api-docs', icon: '🔌' },
            { title: 'Changelog', href: '/changelog', icon: '📝' },
            { title: 'Community', href: '/community', icon: '👥' },
            { title: 'Feedback', href: '/feedback', icon: '💡' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="surface-glass rounded-xl border border-slate-700/50 p-4 text-center transition hover:border-slate-600/50"
            >
              <div className="text-3xl">{link.icon}</div>
              <h4 className="mt-2 font-semibold text-white">{link.title}</h4>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
