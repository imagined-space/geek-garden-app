import { render, screen } from '@testing-library/react';
import Footer from '@/components/common/Footer';

describe('Footer Component', () => {
  it('renders correctly with all sections', () => {
    render(<Footer />);

    // 验证标题部分
    expect(screen.getByText('footer.about')).toBeInTheDocument();
    expect(screen.getByText('footer.quickLinks')).toBeInTheDocument();
    expect(screen.getByText('footer.contactInfo')).toBeInTheDocument();
    expect(screen.getByText('footer.followUs')).toBeInTheDocument();

    // 验证关于部分的描述文本
    expect(screen.getByText('footer.aboutDesc')).toBeInTheDocument();

    // 验证快速链接部分
    expect(screen.getByText('footer.home')).toBeInTheDocument();
    expect(screen.getByText('footer.courses')).toBeInTheDocument();
    expect(screen.getByText('footer.about')).toBeInTheDocument();
    expect(screen.getByText('footer.contact')).toBeInTheDocument();

    // 验证联系信息部分
    expect(screen.getByText('footer.email')).toBeInTheDocument();
    expect(screen.getByText('footer.phone')).toBeInTheDocument();
    expect(screen.getByText('footer.address')).toBeInTheDocument();

    // 验证社交媒体图标
    const socialLinks = screen.getAllByRole('link', {
      name: /facebook|twitter|instagram|linkedin/i,
    });
    expect(socialLinks).toHaveLength(4);

    // 验证版权信息
    expect(screen.getByText('footer.copyright')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    render(<Footer />);

    // 检查首页链接
    const homeLink = screen.getByText('footer.home');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');

    // 检查课程链接
    const coursesLink = screen.getByText('footer.courses');
    expect(coursesLink.closest('a')).toHaveAttribute('href', '/knowledge');

    // 检查关于链接
    const aboutLink = screen.getByText('footer.about', { selector: 'a' });
    expect(aboutLink).toHaveAttribute('href', '/about');

    // 检查联系链接
    const contactLink = screen.getByText('footer.contact');
    expect(contactLink.closest('a')).toHaveAttribute('href', '/contact');
  });

  it('has correct social media links', () => {
    render(<Footer />);

    // 获取所有社交媒体链接
    const facebookLink = screen.getByRole('link', { name: 'facebook' });
    const twitterLink = screen.getByRole('link', { name: 'twitter' });
    const instagramLink = screen.getByRole('link', { name: 'instagram' });
    const linkedinLink = screen.getByRole('link', { name: 'linkedin' });

    // 验证链接目标
    expect(facebookLink).toHaveAttribute('href', 'https://facebook.com');
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com');
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com');
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com');
  });
});
