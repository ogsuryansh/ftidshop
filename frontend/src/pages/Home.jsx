import React, { useEffect } from 'react';

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
                      <div className="text_2xlarge weight_semibold mb_4 color_secondary">The #1 Global service <span className="theme_text_gradient">FTID.SHOP</span></div>
                      <div className="mb_8 color_neutral">Welcome to FTID.SHOP, the #1 global service, offering a large variety of options. The fastest delivery possible, with utmost care and precision, at all times.</div>
                  </div>
                  <div data-width="50%" className="hero_container align_center">
                      <img className="hero_image" src="/assets/images/hero.png" alt="Hero" />
                  </div>
              </div>
          </section>
      </div>

      <section>
          <div className="bg_secondary">
              <div className="container pt_6 pb_6">
                  <div className="couriers_slider align_center"></div>
              </div>
          </div>
      </section>

      <section>
          <div className="container pt_12 pt_12">
              <div className="flex_container flex_wrap -m_4">
                  <div className="flex_rows_3 p_4 radius_medium bg_secondary m_4 align_center">
                      <i className='bx bx-check-shield radius_large vmiddle text_4xlarge pb_2 theme_text_gradient'></i>
                      <div className="mb_3 text_large weight_semibold">Quick Support</div>
                      <div>Our dedication to providing quick and effective support to our clients is at the forefront of everything we do.</div>
                  </div>
                  <div className="flex_rows_3 p_4 radius_medium bg_secondary m_4 align_center">
                      <i className='bx bxs-shopping-bag radius_large vmiddle text_4xlarge pb_2 theme_text_gradient'></i>
                      <div className="mb_3 text_large weight_semibold">Quality Guaranteed</div>
                      <div>Our commitment to excellence is reflected in the quality assurance guarantee that comes with every product we offer.</div>
                  </div>
                  <div className="flex_rows_3 p_4 radius_medium bg_secondary m_4 align_center">
                      <i className='bx bxs-hand radius_large vmiddle text_4xlarge pb_2 theme_text_gradient'></i>
                      <div className="mb_3 text_large weight_semibold">Privacy focused</div>
                      <div>Protecting your data and privacy is our top priority, ensuring that your information remains secure and confidential at all times</div>
                  </div>
              </div>
          </div>
      </section>

      <section>
          <div className="container pt_12 pt_12">
              <div className="align_center text_xlarge pb_12 theme_text_gradient">How does it work ?</div>
              <div className="flex_container flex_wrap">
                  <div className="flex_rows_4 p_4">
                      <span className="step_1 align_center ml_auto mr_auto circle_step button_outlined mb_6 block radius_full text_2xlarge"><i className='theme_text_gradient bx bxs-user-plus'></i></span>
                      <div>
                          <div className="mb_0 text_large theme_text_gradient weight_semibold">1. Register</div>
                          Join today and enjoy hassle-free registration—it's quick, easy, and completely free!
                      </div>
                  </div>
                  <div className="flex_rows_4 p_4">
                      <span className="step_2 align_center ml_auto mr_auto circle_step button_outlined mb_6 block radius_full text_2xlarge"><i className='theme_text_gradient bx bxs-wallet-alt'></i></span>
                      <div>
                          <div className="mb_0 text_large theme_text_gradient weight_semibold">2. Deposit</div>
                          Deposit funds into your account, ensuring your financial transactions are kept private and secure
                      </div>
                  </div>
                  <div className="flex_rows_4 p_4">
                      <span className="step_3 align_center ml_auto mr_auto circle_step button_outlined mb_6 block radius_full text_2xlarge"><i className='theme_text_gradient bx bxs-file-export'></i></span>
                      <div>
                          <div className="mb_0 text_large theme_text_gradient weight_semibold">3. Submit</div>
                          Place your order effortlessly and let our team of experts handle your request with care and efficiency.
                      </div>
                  </div>
                  <div className="flex_rows_4 p_4">
                      <span className="step_4 align_center ml_auto mr_auto circle_step button_outlined mb_6 block radius_full text_2xlarge"><i className='theme_text_gradient bx bx-list-check'></i></span>
                      <div>
                          <div className="mb_0 text_large theme_text_gradient weight_semibold">4. Wait</div>
                          Stay informed every step of the way! Our team will handle your request with expertise and keep you updated throughout the process.
                      </div>
                  </div>
              </div>
          </div>
      </section>
    </>
  );
}
