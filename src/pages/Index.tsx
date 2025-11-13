import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import BookCard from '@/components/BookCard';
import { getLatestReleases, getCategoriesByParent, getBooksByCategory } from '@/data/mockData';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import { useState, useEffect } from 'react';
import { BookIcon, ShoppingCart, Star } from "lucide-react";

import { useToast } from '@/hooks/use-toast';
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast as sonnerToast } from "sonner";

const Index = () => {
  const [books, setBooks] = useState([]);
  const [shirdiBooks,setBooks1]=useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const mainCategories = getCategoriesByParent(null).filter(cat => cat.id !== '1');


    useEffect(() => {
      const fetchBooks = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}new-note`);
          if (!response.ok) throw new Error('Failed to fetch books');
  
          const data = await response.json();
  
          if (data.status === 200 && Array.isArray(data.records)) {
            setBooks(data.records);
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          console.error(error);
          toast({
            title: "Error",
            description: "Failed to load books.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
  
      fetchBooks();
    }, [toast]);
// show shirdi books
   useEffect(() => {
      const shirdi = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}shirdi-sai-baba`);
          if (!response.ok) throw new Error('Failed to fetch books');
  
          const data = await response.json();
  
          if (data.status === 200 && Array.isArray(data.records)) {
            setBooks1(data.records);
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          console.error(error);
          toast({
            title: "Error",
            description: "Failed to load books.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
  
      shirdi()
    }, [toast]);
  
    





    if (loading) {
      return <div className="text-center py-10 text-gray-500">Loading books...</div>;
    }
  

  return (
    <div>
      {/* Hero Carousel */}
      <HeroCarousel />
      
      {/* New & Noteworthy Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">New & Noteworthy</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our latest releases and most popular titles
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {books.length > 0 ? (
          books.map((book) => (
              <BookCard key={book.id} book={book} />
            )
          )): (
          <div className="col-span-full text-center text-gray-500">
            No books found.
          </div>
        )}
          </div>
        </div>  
      </section>
      
      {/* Category Grid */}
      <CategoryGrid />
      
        {/* Shirdi Books */}

         <section  className="py-16 scroll-mt-20">
            <div className="container mx-auto px-4">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-left mb-2">Books on Shirdi Sai Baba</h2>
                <div className="w-16 h-1 bg-primary"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {shirdiBooks.map((book) => (
                  <BookCard key={book.id} book={book} /> // afer add all api remove include mockData then it fine work
                ))}
              </div>
            </div>
          </section>

      {/* Books by Category Sections */}
      {mainCategories.map((category) => {
        const categoryBooks = getBooksByCategory(category.id).slice(0, 10);
        
        if (categoryBooks.length === 0) return null;
        
        return (
          <section key={category.id} id={category.slug} className="py-16 scroll-mt-20">
            <div className="container mx-auto px-4">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-left mb-2">{category.name}</h2>
                <div className="w-16 h-1 bg-primary"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {categoryBooks.map((book) => (
                  <BookCard key={book.id} book={book} /> // afer add all api remove include mockData then it fine work
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Index;
