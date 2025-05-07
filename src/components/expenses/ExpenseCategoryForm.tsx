import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore, ExpenseCategory } from '../../store/expenseStore';
import { Plus, Trash2, Edit, X, Check, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
}

const ExpenseCategoryForm = () => {
  const { user } = useAuthStore();
  const { categories, createCategory, updateCategory, deleteCategory, fetchCategories, loading } = useExpenseStore();
  
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      color: '#3B82F6'
    }
  });
  
  // Predefined colors for easy selection
  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#6B7280', // Gray
  ];
  
  useEffect(() => {
    if (user) {
      fetchCategories(user.id);
    }
  }, [user, fetchCategories]);
  
  const onSubmit = async (data: CategoryFormData) => {
    if (!user) return;
    
    try {
      if (editingCategoryId) {
        // Update existing category
        await updateCategory(editingCategoryId, {
          ...data,
          user_id: user.id
        });
        toast.success('Category updated successfully');
      } else {
        // Create new category
        await createCategory({
          ...data,
          user_id: user.id
        });
        toast.success('Category created successfully');
      }
      
      // Reset form and editing state
      reset({ name: '', description: '', color: '#3B82F6' });
      setEditingCategoryId(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    }
  };
  
  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategoryId(category.id);
    setValue('name', category.name);
    setValue('description', category.description || '');
    setValue('color', category.color);
  };
  
  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    reset({ name: '', description: '', color: '#3B82F6' });
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This cannot be undone.')) {
      setIsDeleting(id);
      try {
        await deleteCategory(id);
      } finally {
        setIsDeleting(null);
      }
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {editingCategoryId ? 'Edit Category' : 'Create New Category'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {editingCategoryId 
            ? 'Update the details of this expense category' 
            : 'Add a new category to organize your expenses'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Office Supplies, Software Subscriptions"
              {...register('name', { required: 'Category name is required' })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              id="description"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Brief description of this category"
              {...register('description')}
            />
          </div>
          
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id="color"
                className="h-8 w-8 border border-gray-300 rounded-md cursor-pointer"
                {...register('color')}
              />
              <input
                type="text"
                className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...register('color')}
              />
            </div>
            
            <div className="mt-2 flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            {editingCategoryId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Saving...
                </span>
              ) : (
                editingCategoryId ? 'Update Category' : 'Add Category'
              )}
            </button>
          </div>
        </div>
      </form>
      
      <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
        <h3 className="text-base font-medium text-gray-900 mb-3">Your Categories</h3>
        
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">No categories found. Create your first category above.</p>
        ) : (
          <ul className="divide-y divide-gray-200 bg-white rounded-md border border-gray-200">
            {categories.map((category) => (
              <li key={category.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  <div 
                    className="h-6 w-6 rounded-full mr-3 flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <Tag className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{category.name}</p>
                    {category.description && (
                      <p className="text-xs text-gray-500">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    disabled={isDeleting === category.id}
                    className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                  >
                    {isDeleting === category.id ? (
                      <div className="h-4 w-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExpenseCategoryForm;