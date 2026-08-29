const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/MyOrders.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('const [reviewModal')) {
  // Add state for review modal
  content = content.replace(
    "const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);",
    `const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);
  const [reviewModal, setReviewModal] = useState<{ orderId: string; productId: string; title: string; image: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);`
  );

  // Add import for Star icon if not present
  if (!content.includes('FiStar')) {
    content = content.replace(
      "FiTrash2\n} from 'react-icons/fi';",
      "FiTrash2,\n  FiStar\n} from 'react-icons/fi';"
    );
  }

  // Add handleSubmitReview function
  const submitFn = `  const handleSubmitReview = async () => {
    if (!reviewModal || !rating || !comment) return;
    setIsSubmittingReview(true);
    try {
      await api.post('/reviews', {
        orderId: reviewModal.orderId,
        productId: reviewModal.productId,
        rating,
        comment
      });
      notifySuccess('Review submitted successfully!');
      setReviewModal(null);
      setComment('');
      setRating(5);
      // Refresh orders so isReviewed becomes true
      dispatch(fetchMyOrders());
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };
`;
  content = content.replace(
    "useEffect(() => {",
    "import { api } from '../services/api';\n\n" + submitFn + "\n  useEffect(() => {"
  );
  // wait, api might already be imported? 
  // Let's remove the import if it fails compilation, or just use the existing one if it exists. Actually MyOrders.tsx doesn't have api imported.

  // Inject Write a Review button into the order items summary
  // Inside selectedOrderModal.orderItems.map
  const itemSummaryRegex = /<span className=\"text-sm font-bold text-gray-900 dark:text-white\">\s*\{formatCurrency\(item\.price \* item\.quantity\)\}\s*<\/span>/;
  const itemReplacement = `<div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      {selectedOrderModal.orderStatus === 'Delivered' && !item.isReviewed && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="!py-1 !px-2 text-[10px]"
                          onClick={() => setReviewModal({
                            orderId: selectedOrderModal._id,
                            productId: item.product,
                            title: item.title,
                            image: item.image
                          })}
                        >
                          Write a Review
                        </Button>
                      )}
                      {selectedOrderModal.orderStatus === 'Delivered' && item.isReviewed && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <FiCheck /> Reviewed
                        </span>
                      )}
                    </div>`;
  content = content.replace(itemSummaryRegex, itemReplacement);

  // Add Review Modal JSX
  const reviewModalJSX = `
      {/* Write a Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-6 z-[61] animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Write a Review</h3>
              <button onClick={() => setReviewModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-6 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <img src={reviewModal.image} alt="Product" className="h-12 w-12 rounded object-cover" />
              <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{reviewModal.title}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={\`p-1 transition-transform hover:scale-110 \${rating >= star ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}\`}
                    >
                      <FiStar className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? What did you use this product for?"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-primary-500"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setReviewModal(null)}>Cancel</Button>
                <Button 
                  variant="primary" 
                  onClick={handleSubmitReview}
                  disabled={!comment.trim() || isSubmittingReview}
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
  `;

  content = content.replace("    </div>\n  );\n};\n\nexport default MyOrders;", reviewModalJSX + "\n    </div>\n  );\n};\n\nexport default MyOrders;");

  fs.writeFileSync(path, content);
  console.log('Updated MyOrders.tsx');
}
