export const CATEGORIES = [
  // ==========================================
  // INCOME CATEGORIES (Focus: Greens, Teals, Blues)
  // ==========================================
  {
    id: 'inc_capital',
    label: 'Capital',
    type: 'income',
    icon: 'briefcase',
    color: '#059669', // Emerald
    description: 'Initial starting balance or funds you had before installing the app.'
  },
  {
    id: 'inc_salary',
    label: 'Salary / Wages',
    type: 'income',
    icon: 'cash',
    color: '#10B981', // Standard Green
    description: 'Regular fixed paycheck from an employer.'
  },
  {
    id: 'inc_freelance',
    label: 'Freelance / Contract',
    type: 'income',
    icon: 'laptop',
    color: '#34D399', // Light Green
    description: 'Income from gig work, clients, or short-term contracts.'
  },
  {
    id: 'inc_business',
    label: 'Business Revenue',
    type: 'income',
    icon: 'storefront',
    color: '#047857', // Dark Green
    description: 'Profits or payouts from a personal business or startup.'
  },
  {
    id: 'inc_investments',
    label: 'Investments / Dividends',
    type: 'income',
    icon: 'trending-up',
    color: '#14B8A6', // Teal
    description: 'Stock market returns, mutual funds, or dividend payouts.'
  },
  {
    id: 'inc_rental',
    label: 'Rental Income',
    type: 'income',
    icon: 'key',
    color: '#065F46', // Very Dark Green
    description: 'Money from renting out property, vehicles, or equipment.'
  },
  {
    id: 'inc_interests',
    label: 'Interests',
    type: 'income',
    icon: 'pie-chart',
    color: '#0F766E', // Dark Teal
    description: 'Interest earned from bank savings or Fixed Deposits.'
  },
  {
    id: 'inc_refunds',
    label: 'Refunds / Reimbursements',
    type: 'income',
    icon: 'arrow-undo',
    color: '#0EA5E9', // Sky Blue
    description: 'Tax refunds, cashbacks, or money returned for canceled purchases.'
  },
  {
    id: 'inc_sale',
    label: 'Sale of Assets',
    type: 'income',
    icon: 'pricetag',
    color: '#84CC16', // Lime
    description: 'Selling a car, an old phone, furniture, or real estate.'
  },
  {
    id: 'inc_pension',
    label: 'Pension / Retirement',
    type: 'income',
    icon: 'umbrella',
    color: '#0369A1', // Dark Sky Blue
    description: 'PF payouts, pensions, or retirement fund withdrawals.'
  },
  {
    id: 'inc_gifts',
    label: 'Gifts / Allowance',
    type: 'income',
    icon: 'gift',
    color: '#2DD4BF', // Light Teal
    description: 'Money received for birthdays, festivals, or from family.'
  },
  {
    id: 'inc_grants',
    label: 'Grants / Scholarships',
    type: 'income',
    icon: 'school',
    color: '#3B82F6', // Blue
    description: 'Educational or government financial aid.'
  },
  {
    id: 'inc_other',
    label: 'Other Income',
    type: 'income',
    icon: 'add-circle',
    color: '#64748B', // Slate
    description: 'Any other miscellaneous income.'
  },

  // ==========================================
  // EXPENSE CATEGORIES (Focus: Warm colors, Purples, Grays)
  // ==========================================
  {
    id: 'exp_base',
    label: 'Base Expense',
    type: 'expense',
    icon: 'server',
    color: '#6B7280', // Neutral Gray (Signifies it is a baseline)
    description: 'Total expenses incurred before using the app. Excluded from daily average calculations.'
  },
  {
    id: 'exp_food',
    label: 'Food & Drinks',
    type: 'expense',
    icon: 'restaurant',
    color: '#EF4444', // Red
    description: 'Groceries, dining out, food delivery, and coffee.'
  },
  {
    id: 'exp_transport',
    label: 'Transport',
    type: 'expense',
    icon: 'bus',
    color: '#F97316', // Orange
    description: 'Public transit, fuel, cabs, flights, and vehicle maintenance.'
  },
  {
    id: 'exp_housing',
    label: 'Housing',
    type: 'expense',
    icon: 'home',
    color: '#8B5CF6', // Purple
    description: 'Rent, mortgage, home repairs, and property tax.'
  },
  {
    id: 'exp_bills',
    label: 'Bills & Utilities',
    type: 'expense',
    icon: 'receipt',
    color: '#6366F1', // Indigo
    description: 'Electricity, water, gas, internet, and mobile recharge.'
  },
  {
    id: 'exp_subscriptions',
    label: 'Subscriptions',
    type: 'expense',
    icon: 'play-circle',
    color: '#8B92A5', // Cool Gray
    description: 'Netflix, Spotify, Gym memberships, and software licenses.'
  },
  {
    id: 'exp_shopping',
    label: 'Shopping',
    type: 'expense',
    icon: 'cart',
    color: '#EC4899', // Pink
    description: 'Clothing, electronics, furniture, and personal items.'
  },
  {
    id: 'exp_entertainment',
    label: 'Entertainment',
    type: 'expense',
    icon: 'film',
    color: '#EAB308', // Yellow
    description: 'Movies, gaming, concerts, and hobbies.'
  },
  {
    id: 'exp_health',
    label: 'Health & Fitness',
    type: 'expense',
    icon: 'medkit',
    color: '#06B6D4', // Cyan
    description: 'Doctor visits, pharmacy, medical tests, and supplements.'
  },
  {
    id: 'exp_emi',
    label: 'EMIs / Loans',
    type: 'expense',
    icon: 'card',
    color: '#B91C1C', // Dark Red
    description: 'Car loans, personal loans, and student loan repayments.'
  },
  {
    id: 'exp_insurance',
    label: 'Insurance',
    type: 'expense',
    icon: 'shield-checkmark',
    color: '#4338CA', // Dark Indigo
    description: 'Life, health, vehicle, or property insurance premiums.'
  },
  {
    id: 'exp_family',
    label: 'Family',
    type: 'expense',
    icon: 'people',
    color: '#F43F5E', // Rose
    description: 'Childcare, pet care, and elderly support.'
  },
  {
    id: 'exp_education',
    label: 'Education',
    type: 'expense',
    icon: 'book',
    color: '#D946EF', // Fuchsia
    description: 'Tuition fees, courses, books, and certifications.'
  },
  {
    id: 'exp_taxes',
    label: 'Taxes',
    type: 'expense',
    icon: 'document-text',
    color: '#C2410C', // Rust
    description: 'Income tax payments, professional tax, and capital gains tax.'
  },
  {
    id: 'exp_charity',
    label: 'Donations / Charity',
    type: 'expense',
    icon: 'heart',
    color: '#F472B6', // Light Pink
    description: 'NGO donations and religious contributions.'
  },
  {
    id: 'exp_misc',
    label: 'Miscellaneous',
    type: 'expense',
    icon: 'ellipsis-horizontal-circle',
    color: '#71717A', // Zinc
    description: 'Unplanned, random, or uncategorized spending.'
  }
];