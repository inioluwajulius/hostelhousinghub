import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { reviewsAPI } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    id: string;
    fullName: string;
    profilePhoto?: string;
  };
}

interface ReviewsProps {
  propertyId: string;
  bookingId?: string;
  canWrite?: boolean;
  onReviewAdded?: () => void;
}

const Reviews = ({ propertyId, bookingId, canWrite = false, onReviewAdded }: ReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [avgRating, setAvgRating] = useState(0);

  // Load reviews
  useEffect(() => {
    loadReviews();
  }, [propertyId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewsAPI.getPropertyReviews(propertyId);
      const mappedReviews = data.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        reviewer: {
          id: review.reviewer_id,
          fullName: review.reviewer?.full_name || "Anonymous",
          profilePhoto: review.reviewer?.profile_photo_url,
        },
      }));
      setReviews(mappedReviews);

      // Calculate average rating
      if (mappedReviews.length > 0) {
        const avg = mappedReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / mappedReviews.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be signed in to review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.createReview(bookingId || propertyId, user.id, {
        property_id: propertyId,
        rating,
        comment: comment.trim() || null,
        review_type: "STUDENT_TO_PROPERTY",
      });

      toast.success("Review submitted successfully!");
      setRating(0);
      setComment("");
      setShowForm(false);
      await loadReviews();

      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;

    if (confirm("Are you sure you want to delete this review?")) {
      try {
        await reviewsAPI.deleteReview(reviewId);
        toast.success("Review deleted");
        await loadReviews();
      } catch (err) {
        console.error("Failed to delete review:", err);
        toast.error("Failed to delete review");
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void, hover?: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "span" as any}
            onMouseEnter={interactive ? () => onRate?.(star) : undefined}
            onMouseLeave={interactive ? () => {} : undefined}
            onClick={interactive ? () => onRate?.(star) : undefined}
            disabled={!interactive}
            className={interactive ? "cursor-pointer p-0.5" : "cursor-default"}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                star <= (interactive ? hover || rating : rating)
                  ? "fill-accent text-accent"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with average rating */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">Reviews</h3>
          {reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1">
                {renderStars(avgRating)}
                <span className="text-sm font-medium text-foreground ml-1">{avgRating}</span>
              </div>
              <Badge variant="secondary">{reviews.length} reviews</Badge>
            </div>
          )}
        </div>

        {canWrite && (
          <Button
            variant={showForm ? "default" : "outline"}
            onClick={() => setShowForm(!showForm)}
            className="gap-1"
          >
            {showForm ? "Cancel" : "Write Review"}
          </Button>
        )}
      </div>

      {/* Review form */}
      {showForm && canWrite && (
        <Card className="p-5 bg-muted/50">
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rating</label>
              <div className="mt-2">
                {renderStars(
                  rating,
                  true,
                  setRating,
                  hoverRating
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Your Review</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this property..."
                className="mt-2 min-h-24"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {comment.length}/500 characters
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3 flex-1">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={review.reviewer.profilePhoto} alt={review.reviewer.fullName} />
                    <AvatarFallback>{review.reviewer.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-foreground">{review.reviewer.fullName}</h4>
                      <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>

                    <div className="mt-1">{renderStars(review.rating)}</div>

                    {review.comment && (
                      <p className="mt-2 text-sm text-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>

                {user?.id === review.reviewer.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReview(review.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
