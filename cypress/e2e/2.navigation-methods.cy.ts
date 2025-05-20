describe('导航方法测试', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => false);
  });

  it('可以通过URL直接导航', () => {
    // 首页 -> 知识库 -> 市场
    cy.visit('/');
    cy.wait(1000);

    cy.visit('/knowledge');
    cy.url().should('include', '/knowledge');
    cy.wait(1000);

    cy.visit('/market');
    cy.url().should('include', '/market');
  });

  it('可以通过JavaScript程序导航', () => {
    cy.visit('/');
    cy.wait(1000);

    // 导航到知识库
    cy.window().then(win => {
      win.location.href = '/knowledge';
    });
    cy.url().should('include', '/knowledge');
    cy.wait(1000);

    // 导航到市场
    cy.window().then(win => {
      win.location.href = '/market';
    });
    cy.url().should('include', '/market');
  });

  it('可以通过点击导航链接导航', () => {
    cy.visit('/');
    cy.wait(2000);

    // 处理覆盖元素
    cy.get('span.mr-1')
      .contains('🇬🇧')
      .then($el => {
        if ($el.length) {
          const element = $el[0];
          if (element && element.parentElement) {
            element.parentElement.style.display = 'none';
          }
        }
      });

    // 点击知识库链接
    cy.get('nav a[href="/knowledge"]').first().click({ force: true });
    cy.url().should('include', '/knowledge');
  });

  it('可以在移动视图下导航', () => {
    cy.viewport('iphone-x');

    cy.visit('/');
    cy.wait(2000);

    // 点击移动菜单按钮
    cy.get('button[aria-label="打开导航菜单"]').click();
    cy.wait(500);

    // 点击移动菜单中的知识库链接
    cy.get('div.md\\:hidden a[href="/knowledge"]').click({ force: true });
    cy.url().should('include', '/knowledge');
  });
});
