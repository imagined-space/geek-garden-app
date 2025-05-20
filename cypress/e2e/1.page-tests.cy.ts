describe('页面基础测试', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => false);
  });

  it('首页能正确加载', () => {
    cy.visit('/');
    cy.url().should('include', '/');
    // 检查页面是否包含标题
    cy.get('html').should('exist');
    cy.title().should('not.be.empty');
  });

  it('知识库页面能正确加载', () => {
    cy.visit('/knowledge');
    cy.url().should('include', '/knowledge');

    // 使用更灵活的检查方式 - 检查标题区域
    cy.get('h1, h2, h3, h4, h5, h6').should('exist');

    // 检查页面是否包含特定元素 - 不依赖于特定语言
    cy.contains(/knowledge|知识/i).should('exist');
  });

  it('市场页面能正确加载', () => {
    cy.visit('/market');
    cy.url().should('include', '/market');

    // 使用更灵活的检查方式 - 检查标题区域
    cy.get('h1, h2, h3, h4, h5, h6').should('exist');

    // 检查页面是否包含特定元素 - 不依赖于特定语言
    cy.contains(/market|市场/i).should('exist');
  });
});
