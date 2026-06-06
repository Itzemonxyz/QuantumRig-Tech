import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Product } from '../types';
import { Check, ShoppingCart, Filter, ArrowRight, RefreshCw, Cpu, Briefcase, Gamepad2, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

type BudgetFilter = 'all' | 'budget' | 'mid' | 'premium';
type UseCaseFilter = 'all' | 'gaming' | 'creator' | 'student';

export default function LaptopFinder() {
  const { products, categories } = useStore();
  const laptopCategory = categories.find(c => c.slug.toLowerCase().includes('laptop') || c.id === 'c11');
  const laptops = products.filter(p => p.categoryId === laptopCategory?.id || ['c11', 'laptops', 'laptop'].includes(p.categoryId) || p.title.toLowerCase().includes('laptop'));
  
  const [budget, setBudget] = useState<BudgetFilter>('all');
  const [useCase, setUseCase] = useState<UseCaseFilter>('all');
  
  const filteredLaptops = useMemo(() => {
    return laptops.filter(laptop => {
      // Budget matching
      let budgetMatch = true;
      if (budget === 'budget') budgetMatch = laptop.price < 80000;
      if (budget === 'mid') budgetMatch = laptop.price >= 80000 && laptop.price < 150000;
      if (budget === 'premium') budgetMatch = laptop.price >= 150000;
      
      // UseCase matching (dummy logic based on title/description)
      let useCaseMatch = true;
      const lowerDesc = (laptop.description || '').toLowerCase() + ' ' + (laptop.title || '').toLowerCase();
      if (useCase === 'gaming') {
        useCaseMatch = lowerDesc.includes('gaming') || lowerDesc.includes('rtx') || lowerDesc.includes('gpu');
      }
      if (useCase === 'creator') {
        useCaseMatch = lowerDesc.includes('creator') || lowerDesc.includes('m3') || lowerDesc.includes('premium') || lowerDesc.includes('oled');
      }
      if (useCase === 'student') {
        useCaseMatch = lowerDesc.includes('budget') || lowerDesc.includes('everyday') || lowerDesc.includes('lightweight');
      }
      
      return budgetMatch && useCaseMatch;
    });
  }, [laptops, budget, useCase]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Laptop Finder</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">Find the perfect laptop based on your budget and primary use-case. We'll recommend the best options for you.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Budget Selection */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-4">1. Select Budget</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBudget('all')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-colors ${budget === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                No Limit
              </button>
              <button
                onClick={() => setBudget('budget')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-colors ${budget === 'budget' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                Under ৳80k
              </button>
              <button
                onClick={() => setBudget('mid')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-colors ${budget === 'mid' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                ৳80k - ৳150k
              </button>
              <button
                onClick={() => setBudget('premium')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-colors ${budget === 'premium' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                Premium (150k+)
              </button>
            </div>
          </div>

          {/* Use Case Selection */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-4">2. Primary Use</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setUseCase('all')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center space-x-2 ${useCase === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Anything</span>
              </button>
              <button
                onClick={() => setUseCase('gaming')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center space-x-2 ${useCase === 'gaming' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Gaming</span>
              </button>
              <button
                onClick={() => setUseCase('creator')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center space-x-2 ${useCase === 'creator' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <Cpu className="w-4 h-4" />
                <span>Creator/Pro</span>
              </button>
              <button
                onClick={() => setUseCase('student')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center space-x-2 ${useCase === 'student' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Office/Student</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recommended For You</h2>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 py-1 px-3 rounded-full">{filteredLaptops.length} matching options</span>
        </div>
        
        {filteredLaptops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLaptops.map(laptop => (
              <ProductCard key={laptop.id} product={laptop} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No exact matches</h3>
            <p className="text-slate-500 mt-2">Try relaxing your budget or changing your primary use case.</p>
            <button
              onClick={() => {
                setBudget('all');
                setUseCase('all');
              }}
              className="mt-6 text-indigo-600 font-bold hover:text-indigo-700 hover:underline flex items-center justify-center mx-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
