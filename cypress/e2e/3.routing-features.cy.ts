describe('路由功能测试', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => false);
  });

  it('支持浏览器历史导航', () => {
    // 创建导航历史
    cy.visit('/');
    cy.wait(1000);

    cy.visit('/knowledge');
    cy.url().should('include', '/knowledge');
    cy.wait(1000);

    cy.visit('/market');
    cy.url().should('include', '/market');
    cy.wait(1000);

    // 测试后退
    cy.go('back');
    cy.url().should('include', '/knowledge');
    cy.wait(1000);

    cy.go('back');
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
    cy.wait(1000);

    // 测试前进
    cy.go('forward');
    cy.url().should('include', '/knowledge');
    cy.wait(1000);

    cy.go('forward');
    cy.url().should('include', '/market');
  });

  it('能够发现并访问所有导航链接', () => {
    cy.visit('/');
    cy.wait(2000);

    // 获取并记录所有内部导航链接
    cy.get('nav a, header a').then($links => {
      // 明确指定类型为字符串数组
      const internalLinks: string[] = [];
      $links.each((i, link) => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && href !== '/') {
          internalLinks.push(href);
        }
      });

      cy.log(`找到 ${internalLinks.length} 个内部链接`);

      // 访问每个链接并验证
      internalLinks.forEach(href => {
        cy.visit(href);
        cy.url().should('include', href);
      });
    });
  });
});
