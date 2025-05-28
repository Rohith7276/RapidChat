import React from 'react';

const Footer = () => (
  <footer style={styles.footer}>
    <div style={styles.container}>
      <div style={styles.logo}>🚀RapidFit</div>
      <ul style={styles.links}>
        {['Home', 'About', 'Contact', 'Privacy Policy'].map((text) => (
          <li key={text}><a href="#" style={styles.link}>{text}</a></li>
        ))}
      </ul>
      <div style={styles.social}>
        {[
          { src: 'https://cdn-icons-png.flaticon.com/512/733/733547.png', alt: 'Facebook' },
          { src: 'https://cdn-icons-png.flaticon.com/512/733/733579.png', alt: 'Twitter' },
          { src: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png', alt: 'Instagram' },
        ].map(({ src, alt }) => (
          <a href="#" key={alt} style={styles.socialLink}>
            <img src={src} alt={alt} style={styles.icon} />
          </a>
        ))}
      </div>
      <p style={styles.text}>&copy; 2025 RapidFit. All rights reserved.</p>
    </div>
  </footer>
);

const styles = {
  footer: {
    background: 'linear-gradient(45deg, #1e1e1e, #3a3a3a)',
    color: 'white',
    padding: '20px',
    textAlign: 'center',
  },
  container: { maxWidth: '800px', margin: '0 auto' },
  logo: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' },
  links: { listStyle: 'none', padding: 0, display: 'flex', justifyContent: 'center', gap: '15px' },
  link: { textDecoration: 'none', color: '#ddd', transition: 'color 0.3s' },
  social: { margin: '15px 0', display: 'flex', justifyContent: 'center', gap: '10px' },
  socialLink: { textDecoration: 'none', color: '#ddd' },
  icon: { width: '24px', height: '24px', transition: 'transform 0.3s' },
  text: { fontSize: '12px', color: '#aaa', marginTop: '15px' },
};

export default Footer;
