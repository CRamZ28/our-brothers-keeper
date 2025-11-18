export const testData = {
  // Test user data
  testUser: {
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
  },

  // Test household
  household: {
    name: 'Smith Family',
    lovedOneName: 'John Smith',
    slug: 'smith-family-test',
  },

  // Test need
  need: {
    title: 'Grocery Shopping Assistance',
    description: 'Need help with weekly grocery shopping',
    category: 'errands',
  },

  // Test event
  event: {
    title: 'Memorial Service',
    description: 'Celebrating John\'s life',
    location: '123 Main Street',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },

  // Test meal train
  mealTrain: {
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mealType: 'dinner',
    notes: 'No peanuts please',
  },

  // Test contact form
  contactForm: {
    subject: 'Test Feature Request',
    message: 'This is a test message for the automated testing suite.',
    type: 'feature_request',
  },
};
