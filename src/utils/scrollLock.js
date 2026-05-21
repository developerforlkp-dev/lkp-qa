let lockCount = 0;
let savedScrollY = 0;
let savedBodyStyles = {};
let savedHtmlStyles = {};

export const lockBodyScroll = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  lockCount += 1;

  if (lockCount === 1) {
    const { body, documentElement } = document;
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    savedBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    savedHtmlStyles = {
      overflow: documentElement.style.overflow,
      overscrollBehavior: documentElement.style.overscrollBehavior,
    };

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  let released = false;
  return () => {
    if (released || typeof window === "undefined" || typeof document === "undefined") return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);

    if (lockCount === 0) {
      const { body, documentElement } = document;
      Object.assign(body.style, savedBodyStyles);
      Object.assign(documentElement.style, savedHtmlStyles);
      window.scrollTo(0, savedScrollY);
      savedBodyStyles = {};
      savedHtmlStyles = {};
      savedScrollY = 0;
    }
  };
};
