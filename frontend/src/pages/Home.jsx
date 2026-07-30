import React, { useEffect } from 'react';
import Hero3DScene from '../components/Hero3DScene';

export default function Home() {
  useEffect(() => {
    if (typeof window.initWave === 'function') {
      window.initWave();
    }
  }, []);

  return (
    <>
      <div className="background_main" id="background_main">
          <div id="wave" className="hero_canvas"></div>
          <section className="hero position_relative px_5 pt_12 pb_12 pl_4 pr_4" style={{ position: 'relative', zIndex: 2 }}>
              <div className="container flex_container items_center">
                  <div data-width="50%">
                      <div className="text_2xlarge weight_semibold mb_4 color_secondary">Welcome to the #1 <span className="theme_text_gradient">Boxing Service Worldwide</span></div>
                      <div className="mb_8 color_neutral">FTID.SHOP provides trusted boxing services to customers across the globe. We focus on fast processing, secure transactions, dependable support, and a seamless experience from start to finish. Our goal is to deliver professional service with consistency, quality, and reliability every time.</div>
                  </div>
                  <div data-width="50%" className="hero_container align_center">
                      <Hero3DScene />
                  </div>
              </div>
          </section>
      </div>

      <section id="couriers">
          <div className="bg_secondary">
              <div className="container pt_6 pb_6">
                  <div className="couriers_slider align_center"></div>
              </div>
          </div>
      </section>

      <section id="features">
          <div className="container pt_12 pb_12">
              <div className="align_center text_xlarge pb_8 theme_text_gradient weight_semibold">Why Choose FTID.SHOP</div>
              <div className="flex_container flex_wrap -m_4">
                  
                  <div className="flex_rows_3 p_4 radius_medium bg_secondary m_4 align_center">
                      <i className='bx bxs-bolt radius_large vmiddle text_4xlarge pb_2 theme_text_gradient'></i>
                      <div className="mb_1 text_large weight_semibold">⚡ Lightning Fast Delivery</div>
                      <div className="text_small theme_text_gradient mb_2 weight_semibold">No Waiting. No Delays.</div>
                      <div className="color_neutral" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>Most orders are completed within minutes, so you can get back to what matters without wasting time.</div>
                  </div>

                  <div className="flex_rows_3 p_4 radius_medium bg_secondary m_4 align_center">
                      <i className='bx bxs-trophy radius_large vmiddle text_4xlarge pb_2 theme_text_gradient'></i>
                      <div className="mb_1 text_large weight_semibold">🏆 Trusted by Thousands</div>
                      <div className="text_small theme_text_gradient mb_2 weight_semibold">Built on Reputation</div>
                      <div className="color_neutral" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>Thousands of satisfied customers choose FTID.SHOP for consistent service, reliability, and professional support.</div>
                  </div>

                  <div className="flex_rows_3 p_4 radius_medium bg_secondary m_4 align_center">
                      <i className='bx bxs-shield-quarter radius_large vmiddle text_4xlarge pb_2 theme_text_gradient'></i>
                      <div className="mb_1 text_large weight_semibold">🛡️ Your Data Stays Yours</div>
                      <div className="text_small theme_text_gradient mb_2 weight_semibold">Privacy Without Compromise</div>
                      <div className="color_neutral" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>We never sell or share your information. Every order is handled securely and confidentially.</div>
                  </div>

                  <div className="flex_rows_3 p_4 radius_medium bg_secondary m_4 align_center">
                      <i className='bx bx-globe radius_large vmiddle text_4xlarge pb_2 theme_text_gradient'></i>
                      <div className="mb_1 text_large weight_semibold">🌍 Global Availability</div>
                      <div className="text_small theme_text_gradient mb_2 weight_semibold">Access From Anywhere</div>
                      <div className="color_neutral" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>Our services are available worldwide with seamless support for customers across multiple regions.</div>
                  </div>

                  <div className="flex_rows_3 p_4 radius_medium bg_secondary m_4 align_center">
                      <i className='bx bxs-diamond radius_large vmiddle text_4xlarge pb_2 theme_text_gradient'></i>
                      <div className="mb_1 text_large weight_semibold">💎 Premium Experience</div>
                      <div className="text_small theme_text_gradient mb_2 weight_semibold">Designed for Professionals</div>
                      <div className="color_neutral" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>A clean ordering process, instant updates, and premium customer care from start to finish.</div>
                  </div>

                  <div className="flex_rows_3 p_4 radius_medium bg_secondary m_4 align_center">
                      <i className='bx bx-sync radius_large vmiddle text_4xlarge pb_2 theme_text_gradient'></i>
                      <div className="mb_1 text_large weight_semibold">🔄 Regular Updates</div>
                      <div className="text_small theme_text_gradient mb_2 weight_semibold">Always Improving</div>
                      <div className="color_neutral" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>We continuously improve our platform by adding new features, optimizing performance, and expanding our services.</div>
                  </div>

              </div>
          </div>
      </section>

      <section id="how-it-works">
          <div className="container pt_12 pb_12">
              <div className="align_center text_xlarge pb_12 theme_text_gradient weight_semibold">How does it work ?</div>
              <div className="flex_container flex_wrap">
                  <div className="flex_rows_4 p_4">
                      <span className="step_1 align_center ml_auto mr_auto circle_step button_outlined mb_6 block radius_full text_2xlarge"><i className='theme_text_gradient bx bxs-user-plus'></i></span>
                      <div>
                          <div className="mb_0 text_large theme_text_gradient weight_semibold">1. Sign Up</div>
                          Create your free account in just a few clicks and get started instantly.
                      </div>
                  </div>
                  <div className="flex_rows_4 p_4">
                      <span className="step_2 align_center ml_auto mr_auto circle_step button_outlined mb_6 block radius_full text_2xlarge"><i className='theme_text_gradient bx bxs-grid-alt'></i></span>
                      <div>
                          <div className="mb_0 text_large theme_text_gradient weight_semibold">2. Choose Service</div>
                          Browse our services and select the one that best fits your needs.
                      </div>
                  </div>
                  <div className="flex_rows_4 p_4">
                      <span className="step_3 align_center ml_auto mr_auto circle_step button_outlined mb_6 block radius_full text_2xlarge"><i className='theme_text_gradient bx bxs-credit-card'></i></span>
                      <div>
                          <div className="mb_0 text_large theme_text_gradient weight_semibold">3. Complete Payment</div>
                          Complete your payment securely and submit your order with confidence.
                      </div>
                  </div>
                  <div className="flex_rows_4 p_4">
                      <span className="step_4 align_center ml_auto mr_auto circle_step button_outlined mb_6 block radius_full text_2xlarge"><i className='theme_text_gradient bx bxs-package'></i></span>
                      <div>
                          <div className="mb_0 text_large theme_text_gradient weight_semibold">4. Get Your Order</div>
                          Our team will process your request and deliver your order as quickly as possible while keeping you updated.
                      </div>
                  </div>
              </div>
          </div>
      </section>
    </>
  );
}


