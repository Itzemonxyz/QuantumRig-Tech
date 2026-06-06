const fs = require('fs');

let content = fs.readFileSync('src/pages/ProductDetails.tsx', 'utf8');

// The file currently has:
// export default function ProductDetails() {
// ...
// }
// We want to extract it into:
// export default function ProductDetails() { ... early return or return inner ... }
// function ProductDetailsInner({ product }: {product: any}) { ... }

let newContent = content.replace(
  'export default function ProductDetails() {',
  `export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useStore();
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/products')} className="text-indigo-600 hover:underline">
          Return to Products
        </button>
      </div>
    );
  }

  return <ProductDetailsInner product={product} />;
}

function ProductDetailsInner({ product }: { product: any }) {`
);

// We need to remove the existing lines 10-27 basically.
// Instead of complex regex, let's just do it manually with multi_edit_file or exact string replacement.
