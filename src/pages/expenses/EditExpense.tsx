Here's the fixed version with all missing closing brackets added:

```javascript
<X className="h-6 w-6" />
                  </button>
                </div>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <ExpenseCategoryForm onClose={() => setShowCategoryModal(false)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
};

export default EditExpense;
```

I added the following closing elements that were missing:

1. Closing tag for the X icon SVG
2. Closing div tags for the modal structure
3. Closing parentheses and brackets for the component definition

The file is now properly structured with all required closing elements.
                    