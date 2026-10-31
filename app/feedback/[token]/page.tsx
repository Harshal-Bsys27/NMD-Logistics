'use client';

import { use, useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface FeedbackPageProps {
  params: Promise<{ token: string }>;
}

interface FeedbackLinkDetails {
  submitted: boolean;
  order_number?: string;
  delivered_at?: string;
}

export default function CustomerFeedbackPage({ params }: FeedbackPageProps) {
  const { token } = use(params);
  const [details, setDetails] = useState<FeedbackLinkDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    const loadFeedbackRequest = async () => {
      try {
        const response = await fetch(`/api/customer-feedback/${encodeURIComponent(token)}`, { cache: 'no-store' });
        const result = await response.json() as FeedbackLinkDetails & { error?: string };
        if (!response.ok) throw new Error(result.error || 'This feedback link is unavailable.');
        if (active) {
          setDetails(result);
          setSubmitted(result.submitted);
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load this feedback form.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadFeedbackRequest();
    return () => { active = false; };
  }, [token]);

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    if (rating < 1 || rating > 5) {
      setSubmitError('Please choose a star rating before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/customer-feedback/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review }),
      });
      const result = await response.json() as { submitted?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to submit your feedback.');
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit your feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <main className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Star className="h-7 w-7 fill-current" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">NMD Logistics</p>
        </div>

        <section className="surface-glass rounded-2xl border border-border p-6 shadow-xl sm:p-8">
          {loading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground" role="status">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm">Loading your feedback form…</p>
            </div>
          ) : loadError ? (
            <div className="py-8 text-center">
              <h1 className="text-xl font-bold text-foreground">Feedback link unavailable</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{loadError}</p>
              <p className="mt-4 text-sm text-muted-foreground">Please contact the delivery team if you still need to share feedback.</p>
            </div>
          ) : submitted ? (
            <div className="py-8 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success-foreground">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h1 className="mt-5 text-2xl font-bold text-foreground">Thank you for your feedback</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Your response has been recorded. We appreciate you taking the time to help us improve.</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">How was your delivery?</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Share a quick rating for order <span className="font-semibold text-foreground">{details?.order_number}</span>.
                </p>
                {details?.delivered_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Delivered {new Date(details.delivered_at).toLocaleString()}
                  </p>
                )}
              </div>

              <form onSubmit={submitFeedback} className="mt-8 space-y-6">
                <fieldset>
                  <legend className="mb-3 text-center text-sm font-semibold text-foreground">Choose a rating</legend>
                  <div className="flex justify-center gap-2" role="radiogroup" aria-label="Delivery rating">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={rating === value}
                        aria-label={`${value} star${value === 1 ? '' : 's'}`}
                        onClick={() => setRating(value)}
                        className={`flex h-12 w-12 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          rating >= value
                            ? 'border-warning/50 bg-warning/15 text-warning-foreground'
                            : 'border-border bg-muted/40 text-muted-foreground hover:border-warning/40 hover:text-warning-foreground'
                        }`}
                      >
                        <Star className={`h-6 w-6 ${rating >= value ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 min-h-5 text-center text-sm font-medium text-warning-foreground" aria-live="polite">
                    {rating ? ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating] : ''}
                  </p>
                </fieldset>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Tell us more <span className="font-normal text-muted-foreground">(optional)</span>
                  </span>
                  <textarea
                    maxLength={1000}
                    rows={4}
                    value={review}
                    onChange={(event) => setReview(event.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                    placeholder="What went well, or what could we improve?"
                  />
                  <span className="mt-1 block text-right text-xs text-muted-foreground">{review.length}/1000</span>
                </label>

                {submitError && (
                  <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger-foreground">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Submitting…' : 'Submit feedback'}
                </button>
              </form>
            </>
          )}
        </section>
        <p className="mt-5 text-center text-xs text-muted-foreground">Your feedback helps us improve every delivery.</p>
      </main>
    </div>
  );
}
