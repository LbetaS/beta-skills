export function loadImageFile(file, { createImage = () => new Image(), urlApi = URL } = {}) {
  const image = createImage();
  const objectUrl = urlApi.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const releaseObjectUrl = () => {
      urlApi.revokeObjectURL(objectUrl);
    };

    image.onload = () => {
      const imageInfo = {
        image,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        name: file.name,
      };
      releaseObjectUrl();
      resolve(imageInfo);
    };

    image.onerror = () => {
      releaseObjectUrl();
      reject(new Error(`无法读取图片：${file.name || '未知文件'}`));
    };

    image.src = objectUrl;
  });
}

export function loadRetainedImageFile(file, { createImage = () => new Image(), urlApi = URL } = {}) {
  const image = createImage();
  const objectUrl = urlApi.createObjectURL(file);
  let released = false;

  return new Promise((resolve, reject) => {
    const release = () => {
      if (released) return;
      released = true;
      urlApi.revokeObjectURL(objectUrl);
    };

    image.onload = () => {
      resolve({
        image,
        name: file.name,
        release,
      });
    };

    image.onerror = () => {
      release();
      reject(new Error(`无法读取头像：${file.name || '未知文件'}`));
    };

    image.src = objectUrl;
  });
}
