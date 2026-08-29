const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/ProductDetails.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for reviews
content = content.replace(
  "const [newReviewComment, setNewReviewComment] = useState('');",
  "const [reviews, setReviews] = useState<any[]>([]);"
);
content = content.replace(
  "const [newReviewRating, setNewReviewRating] = useState(5);\n",
  ""
);

// 2. Fetch reviews along with product
const fetchProductOld = `        setProduct(prod);`;
const fetchProductNew = `        setProduct(prod);
        
        try {
          const revRes = await api.get(\`/reviews/product/\${prod._id}\`);
          setReviews(revRes.data?.data?.reviews || []);
        } catch (e) {
          console.error('Failed to load reviews', e);
        }`;
content = content.replace(fetchProductOld, fetchProductNew);

// 3. Remove the review form and replace the static review with dynamic reviews map
const oldReviewsBlockRegex = /\{\/\* Submit Review \*\/\}[\s\S]*?(?=\{\/\* Related Products Grid \*\/)/;

const newReviewsBlock = `
            {/* List of Reviews */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No reviews yet. Be the first to review this product after purchasing!</p>
              ) : (
                reviews.map((review: any) => (
                  <div key={review._id} className="border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 font-bold text-indigo-700 flex items-center justify-center text-xs uppercase">
                        {review.user?.name ? review.user.name.substring(0, 2) : 'AN'}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-gray-900 dark:text-white">{review.user?.name || 'Anonymous User'}</h5>
                        <div className="flex items-center gap-1">
                          <RatingComponent value={review.rating} readOnly size="sm" />
                          <span className="text-[10px] text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2.5 text-xs text-gray-600 dark:text-gray-400">
                      {review.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      `;

content = content.replace(oldReviewsBlockRegex, newReviewsBlock);

fs.writeFileSync(path, content);
console.log('Updated ProductDetails.tsx');
