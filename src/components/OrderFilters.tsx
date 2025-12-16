import { useState } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClearFilters: () => void;
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const OrderFiltersComponent = ({ filters, onFiltersChange, onClearFilters }: OrderFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<OrderFilters>(filters);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const handleFilterChange = (key: keyof OrderFilters, value: string | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value.trim() !== '').length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Search and Status Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders by order number or items..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={localFilters.status || ''}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date From */}
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-48 justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {localFilters.dateFrom ? format(new Date(localFilters.dateFrom), 'MMM dd, yyyy') : 'From Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined}
                onSelect={(date) => {
                  handleFilterChange('dateFrom', date ? format(date, 'yyyy-MM-dd') : undefined);
                  setDateFromOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Date To */}
          <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-48 justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {localFilters.dateTo ? format(new Date(localFilters.dateTo), 'MMM dd, yyyy') : 'To Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={localFilters.dateTo ? new Date(localFilters.dateTo) : undefined}
                onSelect={(date) => {
                  handleFilterChange('dateTo', date ? format(date, 'yyyy-MM-dd') : undefined);
                  setDateToOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Active filters:
            </span>
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {filters.search}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('search', undefined)}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {ORDER_STATUSES.find(s => s.value === filters.status)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('status', undefined)}
                />
              </Badge>
            )}
            {filters.dateFrom && (
              <Badge variant="secondary" className="flex items-center gap-1">
                From: {format(new Date(filters.dateFrom), 'MMM dd, yyyy')}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('dateFrom', undefined)}
                />
              </Badge>
            )}
            {filters.dateTo && (
              <Badge variant="secondary" className="flex items-center gap-1">
                To: {format(new Date(filters.dateTo), 'MMM dd, yyyy')}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('dateTo', undefined)}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};