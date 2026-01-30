export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Customize rules as needed
    'body-max-line-length': [1, 'always', 100], // Warn instead of error
    'footer-max-line-length': [1, 'always', 100],
  },
}
