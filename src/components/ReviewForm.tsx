import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  propertyId: string;
  bookingId?: string;
  onSubmitted: () => void;
}

const ReviewForm = ({ propertyId, bookingId, onSubmitted }: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (rating === 0) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      reviewer_id: user.id,
      property_id: propertyId,
      booking_id: bookingId || null,
      rating,
      comment: comment.trim() || null,
      review_type: "STUDENT_TO_PROPERTY" as any,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Review submitted!");
      setRating(0);
      setComment("");
      onSubmitted();
    }
  };

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4">
      <h3 className="font-display font-semibold text-foreground">Write a Review</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(s)}
            className="p-0.5"
          >
            <Star className={`w-7 h-7 transition-colors ${
              s <= (hoverRating || rating) ? "fill-accent text-accent" : "text-muted"
            }`} />
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-sm text-muted-foreground self-center">{rating}/5</span>}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience..."
        rows={3}
      />
      <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
};

export default ReviewForm;
