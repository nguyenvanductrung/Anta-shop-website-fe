import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components';
import './BlogDetailPage.css';

export default function BlogDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const post = {
    id: id,
    title: 'ANTA tặng code ưu đãi độc quyền sốc cho khách hàng thành viên',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1200',
    category: 'Khuyến mãi',
    date: '2024-01-15',
    author: 'ANTA Việt Nam',
    readTime: '3 phút đọc',
    content: `
      <p>Chương trình ưu đãi đặc biệt dành riêng cho khách hàng thành viên của ANTA Việt Nam đã chính thức được triển khai. Đây là cơ hội tuyệt vời để các khách hàng trung thành có thể sở hữu những sản phẩm chất lượng cao với mức giá ưu đãi nhất.</p>

      <h2>Các mã giảm giá độc quyền</h2>
      <p>ANTA Việt Nam tự hào giới thiệu ba mức ưu đãi hấp dẫn dành cho khách hàng thành viên:</p>

      <ul>
        <li><strong>CAMP50</strong> - Giảm 50.000₫ cho đơn hàng từ 999.000₫</li>
        <li><strong>CAMP100</strong> - Giảm 100.000₫ cho đơn hàng từ 1.599.000₫</li>
        <li><strong>CAMP250</strong> - Giảm 250.000₫ cho đơn hàng từ 2.999.000₫</li>
      </ul>

      <h2>Cách thức áp dụng</h2>
      <p>Việc sử dụng mã giảm giá vô cùng đơn giản. Bạn chỉ cần:</p>

      <ol>
        <li>Chọn sản phẩm yêu thích và thêm vào giỏ hàng</li>
        <li>Tiến hành thanh toán</li>
        <li>Nhập mã giảm giá phù hợp vào ô "Mã giảm giá"</li>
        <li>Nhấn "Áp dụng" để hưởng ưu đãi</li>
      </ol>

      <h2>Thời gian áp dụng</h2>
      <p>Chương trình có hiệu lực từ ngày 15/01/2024 đến hết ngày 31/01/2024. Đừng bỏ lỡ cơ hội tuyệt vời này!</p>

      <h2>Điều khoản và điều kiện</h2>
      <ul>
        <li>Mỗi khách hàng chỉ được sử dụng mỗi mã giảm giá một lần</li>
        <li>Không áp dụng đồng thời với các chương trình khuyến mãi khác</li>
        <li>Mã giảm giá chỉ áp dụng cho sản phẩm không sale</li>
        <li>ANTA Việt Nam có quyền thay đổi hoặc kết thúc chương trình mà không cần báo trước</li>
      </ul>

      <p>Hãy nhanh tay đăng ký thành viên và tận hưởng những ưu đãi độc quyền từ ANTA Việt Nam. Trải nghiệm mua sắm tuyệt vời với những sản phẩm thể thao chất lượng cao đang chờ đón bạn!</p>
    `
  };

  const relatedPosts = [
    {
      id: 2,
      title: 'Bí quyết chọn giày chạy bộ phù hợp cho người mới bắt đầu',
      image: 'https://images.pexels.com/photos/2529157/pexels-photo-2529157.jpeg?auto=compress&cs=tinysrgb&w=600',
      date: '2024-01-12'
    },
    {
      id: 3,
      title: 'ANTA ra mắt bộ sưu tập mới dành cho mùa hè 2024',
      image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600',
      date: '2024-01-10'
    },
    {
      id: 4,
      title: '5 bài tập thể dục tại nhà hiệu quả với trang phục ANTA',
      image: 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=600',
      date: '2024-01-08'
    }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Layout>
      <div className="detail-page">
        <div className="detail-breadcrumbs">
          <div className="container">
            <button className="breadcrumb-link" onClick={() => navigate('/home')}>Trang chủ</button>
            <span className="breadcrumb-separator">/</span>
            <button className="breadcrumb-link" onClick={() => navigate('/blog')}>Tin tức</button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">{post.title}</span>
          </div>
        </div>

        <div className="detail-content">
          <div className="container">
            <article className="article">
              <header className="article-head">
                <span className="article-category">{post.category}</span>
                <h1 className="article-headline">{post.title}</h1>
                <div className="article-info">
                  <span className="info-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 10c-3.866 0-7 2.015-7 4.5v.5h14v-.5c0-2.485-3.134-4.5-7-4.5z" fill="currentColor"/>
                    </svg>
                    {post.author}
                  </span>
                  <span className="info-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 2h-11A1.5 1.5 0 001 3.5v9A1.5 1.5 0 002.5 14h11a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0013.5 2z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M11 1v2M5 1v2M1 6h14" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    {formatDate(post.date)}
                  </span>
                  <span className="info-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {post.readTime}
                  </span>
                </div>
              </header>

              <div className="article-image">
                <img src={post.image} alt={post.title} />
              </div>

              <div className="article-body" dangerouslySetInnerHTML={{ __html: post.content }} />

              <footer className="article-foot">
                <div className="article-tags">
                  <span className="tag-item">ANTA</span>
                  <span className="tag-item">Khuyến mãi</span>
                  <span className="tag-item">Ưu đãi</span>
                  <span className="tag-item">Thành viên</span>
                </div>

                <div className="article-share">
                  <span className="share-text">Chia sẻ:</span>
                  <button className="share-btn facebook">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                  <button className="share-btn twitter">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Twitter
                  </button>
                  <button className="share-btn zalo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.97c-.558.663-2.122 1.546-3.894 1.546-3.037 0-5.5-2.463-5.5-5.5S10.963 7.516 14 7.516c3.037 0 5.5 2.463 5.5 5.5 0 1.002-.27 1.94-.75 2.748l1.25 1.25-.106.956z"/>
                    </svg>
                    Zalo
                  </button>
                </div>
              </footer>
            </article>

            <div className="related-section">
              <h2 className="related-title">Bài viết liên quan</h2>
              <div className="related-grid">
                {relatedPosts.map(relatedPost => (
                  <div
                    key={relatedPost.id}
                    className="related-item"
                    onClick={() => {
                      navigate(`/blog/${relatedPost.id}`);
                      window.scrollTo(0, 0);
                    }}
                  >
                    <div className="related-thumb">
                      <img src={relatedPost.image} alt={relatedPost.title} />
                    </div>
                    <div className="related-text">
                      <span className="related-date">
                        {formatDate(relatedPost.date)}
                      </span>
                      <h3 className="related-heading">{relatedPost.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="comments-area">
              <h2 className="comments-title">Bình luận</h2>
              <div className="comment-form">
                <textarea
                  placeholder="Để lại bình luận của bạn..."
                  rows="4"
                  className="comment-textarea"
                ></textarea>
                <button className="comment-submit">Gửi bình luận</button>
              </div>

              <div className="comments-list">
                <div className="comment">
                  <div className="comment-avatar">N</div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <strong className="comment-author">Nguyễn Văn A</strong>
                      <span className="comment-date">2 ngày trước</span>
                    </div>
                    <p className="comment-text">
                      Chương trình rất hấp dẫn! Cảm ơn ANTA đã mang đến những ưu đãi tuyệt vời cho khách hàng.
                    </p>
                  </div>
                </div>

                <div className="comment">
                  <div className="comment-avatar">T</div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <strong className="comment-author">Trần Thị B</strong>
                      <span className="comment-date">3 ngày trước</span>
                    </div>
                    <p className="comment-text">
                      Mình đã sử dụng mã CAMP100 và rất hài lòng. Sản phẩm chất lượng, giao hàng nhanh!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
