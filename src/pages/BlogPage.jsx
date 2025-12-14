import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components';
import './BlogPage.css';

export default function BlogPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'news', name: 'Tin tức' },
    { id: 'promotion', name: 'Khuyến mãi' },
    { id: 'sport', name: 'Thể thao' },
    { id: 'guide', name: 'Hướng dẫn' }
  ];

  const blogPosts = [
    {
      id: 1,
      title: 'ANTA tặng code ưu đãi độc quyền sốc cho khách hàng thành viên',
      excerpt: 'Chương trình ưu đãi đặc biệt dành riêng cho khách hàng thành viên của ANTA Việt Nam. Nhận ngay mã giảm giá lên đến 250.000đ cho các sản phẩm chính hãng...',
      image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'promotion',
      date: '2024-01-15',
      author: 'ANTA Việt Nam',
      readTime: '3 phút đọc'
    },
    {
      id: 2,
      title: 'Bí quyết chọn giày chạy bộ phù hợp cho người mới bắt đầu',
      excerpt: 'Việc lựa chọn một đôi giày chạy bộ phù hợp là vô cùng quan trọng đối với người mới bắt đầu. Hãy cùng ANTA tìm hiểu những tiêu chí quan trọng nhất khi lựa chọn...',
      image: 'https://images.pexels.com/photos/2529157/pexels-photo-2529157.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'guide',
      date: '2024-01-12',
      author: 'Nguyễn Văn A',
      readTime: '5 phút đọc'
    },
    {
      id: 3,
      title: 'ANTA ra mắt bộ sưu tập mới dành cho mùa hè 2024',
      excerpt: 'Bộ sưu tập mùa hè 2024 của ANTA mang đến những thiết kế trẻ trung, năng động với chất liệu thoáng mát, phù hợp cho mọi hoạt động thể thao trong mùa hè...',
      image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'news',
      date: '2024-01-10',
      author: 'ANTA Việt Nam',
      readTime: '4 phút đọc'
    },
    {
      id: 4,
      title: '5 bài tập thể dục tại nhà hiệu quả với trang phục ANTA',
      excerpt: 'Không cần đến phòng gym, bạn vẫn có thể duy trì vóc dáng hoàn hảo với 5 bài tập đơn giản tại nhà cùng trang phục thể thao ANTA chất lượng cao...',
      image: 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'sport',
      date: '2024-01-08',
      author: 'Trần Thị B',
      readTime: '6 phút đọc'
    },
    {
      id: 5,
      title: 'Mega Sale cuối năm - Giảm giá lên đến 50% toàn bộ sản phẩm',
      excerpt: 'Sự kiện Mega Sale lớn nhất trong năm đã quay trở lại! Hàng ngàn sản phẩm giảm giá sốc lên đến 50%. Đừng bỏ lỡ cơ hội sở hữu sản phẩm chính hãng với giá tốt nhất...',
      image: 'https://images.pexels.com/photos/1619654/pexels-photo-1619654.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'promotion',
      date: '2024-01-05',
      author: 'ANTA Việt Nam',
      readTime: '2 phút đọc'
    },
    {
      id: 6,
      title: 'Cách bảo quản giày thể thao để giữ được lâu nhất',
      excerpt: 'Những mẹo đơn giản nhưng hiệu quả giúp bạn bảo quản giày thể thao luôn mới và bền đẹp theo thời gian. Tìm hiểu ngay để giày của bạn được bảo vệ tốt nhất...',
      image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'guide',
      date: '2024-01-03',
      author: 'Lê Văn C',
      readTime: '4 phút đọc'
    },
    {
      id: 7,
      title: 'Top 10 xu hướng thời trang thể thao năm 2024',
      excerpt: 'Khám phá những xu hướng thời trang thể thao hot nhất trong năm 2024. Từ màu sắc, chất liệu đến kiểu dáng, tất cả đều được ANTA cập nhật và giới thiệu đến bạn...',
      image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'sport',
      date: '2024-01-01',
      author: 'Phạm Văn D',
      readTime: '7 phút đọc'
    }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPost = blogPosts[0];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.name || categoryId;
  };

  return (
    <Layout>
      <div className="news-page">
        <div className="news-breadcrumbs">
          <div className="container">
            <button className="breadcrumb-link" onClick={() => navigate('/home')}>Trang chủ</button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Tin tức</span>
          </div>
        </div>

        <div className="news-content">
          <div className="container">
            <div className="news-header">
              <h1 className="page-title">Tin Tức & Sự Kiện</h1>
              <p className="page-subtitle">Cập nhật những thông tin mới nhất từ ANTA Việt Nam</p>
            </div>

            <div className="featured-article" onClick={() => navigate(`/blog/${featuredPost.id}`)}>
              <div className="featured-img">
                <img src={featuredPost.image} alt={featuredPost.title} />
                <span className="featured-tag">Nổi bật</span>
              </div>
              <div className="featured-info">
                <div className="article-meta">
                  <span className="category-tag">{getCategoryName(featuredPost.category)}</span>
                  <span className="publish-date">{formatDate(featuredPost.date)}</span>
                </div>
                <h2 className="featured-title">{featuredPost.title}</h2>
                <p className="featured-excerpt">{featuredPost.excerpt}</p>
                <div className="article-footer">
                  <span className="author-name">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 10c-3.866 0-7 2.015-7 4.5v.5h14v-.5c0-2.485-3.134-4.5-7-4.5z" fill="currentColor"/>
                    </svg>
                    {featuredPost.author}
                  </span>
                  <span className="read-time">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {featuredPost.readTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="category-filter">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="news-grid">
              {filteredPosts.slice(1).map(post => (
                <article
                  key={post.id}
                  className="news-card"
                  onClick={() => navigate(`/blog/${post.id}`)}
                >
                  <div className="news-thumbnail">
                    <img src={post.image} alt={post.title} />
                    <span className="category-badge">
                      {getCategoryName(post.category)}
                    </span>
                  </div>
                  <div className="news-info">
                    <div className="news-meta">
                      <span className="date-text">{formatDate(post.date)}</span>
                      <span className="time-text">{post.readTime}</span>
                    </div>
                    <h3 className="news-title">{post.title}</h3>
                    <p className="news-excerpt">{post.excerpt}</p>
                    <div className="news-footer">
                      <span className="author-info">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 10c-3.866 0-7 2.015-7 4.5v.5h14v-.5c0-2.485-3.134-4.5-7-4.5z" fill="currentColor"/>
                        </svg>
                        {post.author}
                      </span>
                      <button className="read-more">
                        Đọc thêm
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="pagination">
              <button className="page-btn" disabled>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Trước
              </button>
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn">
                Sau
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
