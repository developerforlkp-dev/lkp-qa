import React from 'react';
// Import images


const CtaTwo = () => {
  return (
    <>
    {/*CTA One Start*/}
    <section className="cta-one">
    <div className="container">
      <div className="cta-one__inner">
        <h3 className="cta-one__title">
          Get Latest Updates Subscribe <br /> to Our Newsletter
        </h3>
        <form
          className="cta-one__form mc-form"
          data-url="MC_FORM_URL"
          noValidate
        >
          <div className="cta-one__form-input-box">
            <input
              type="email"
              placeholder="Enter your email"
              name="EMAIL"
            />
            <button type="submit" className="cta-one__btn">
              <span className="icon-paper-plan"></span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </section>
    {/*CTA One End*/}
    </>
  );
};

export default CtaTwo;
