import { useState, useEffect } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MenuService } from '@/services/menuService';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

const PublishWithUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    synopsis: '',
    category: '',
    language: '',
    consent: false
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { toast } = useToast();

  const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Oriya', 'Sanskrit'];

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await MenuService.getCategories();
      // Filter main categories (no parent_id)
      const mainCategories = response.filter(cat => !cat.parent_id);
      setCategories(mainCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Use fallback categories if API fails
      setCategories([
        { id: '2', name: 'Books on Shirdi Sai Baba', slug: 'shirdi-sai-baba', parent_id: null },
        { id: '3', name: 'Other Religious Books', slug: 'other-religious', parent_id: null },
        { id: '4', name: 'Coffee Table Books and Paperbacks', slug: 'coffee-table-paperbacks', parent_id: null },
        { id: '5', name: 'Text Books', slug: 'textbooks', parent_id: null },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      toast({
        title: "Consent required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Submission received!",
      description: "We'll review your manuscript and get back to you within 15 business days.",
    });
    
    setFormData({
      name: '',
      email: '',
      phone: '',
      title: '',
      synopsis: '',
      category: '',
      language: '',
      consent: false
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Publish with Us!</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Join our family of distinguished authors. Sterling Publishers has been nurturing literary talent 
          and bringing exceptional books to readers for decades.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Why Publish with Sterling */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Why Choose Sterling?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-medium">Expert Editorial Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Professional editing and proofreading services
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-medium">Wide Distribution</h3>
                  <p className="text-sm text-muted-foreground">
                    Extensive network across India and international markets
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-medium">Digital & Print</h3>
                  <p className="text-sm text-muted-foreground">
                    Both digital and traditional print publishing options
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-medium">Marketing Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Promotional campaigns and author branding assistance
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-medium">Fair Royalties</h3>
                  <p className="text-sm text-muted-foreground">
                    Competitive royalty structure for authors
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Manuscript</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Manuscript Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Manuscript Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Manuscript Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingCategories ? (
                            <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                          ) : (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.slug}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language *</Label>
                      <Select onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((language) => (
                            <SelectItem key={language} value={language.toLowerCase()}>
                              {language}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="synopsis">Synopsis *</Label>
                    <Textarea
                      id="synopsis"
                      name="synopsis"
                      value={formData.synopsis}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Please provide a detailed synopsis of your manuscript (500-1000 words)"
                      required
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Manuscript Upload</h3>
                  
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Drag and drop your manuscript file here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Accepted formats: PDF, DOC, DOCX (Max size: 10MB)
                    </p>
                    <Button variant="outline" className="mt-4">
                      Choose File
                    </Button>
                  </div>
                </div>

                {/* Consent */}
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="consent"
                    checked={formData.consent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, consent: checked as boolean }))}
                  />
                  <Label htmlFor="consent" className="text-sm leading-relaxed">
                    I agree to the terms and conditions and authorize Sterling Publishers to review my manuscript. 
                    I understand that the review process may take up to 15 business days.
                  </Label>
                </div>

                <Button type="submit" className="w-full">
                  Submit Manuscript
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublishWithUs;