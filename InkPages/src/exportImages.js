function canvasToPngBlob(canvas, pageNumber) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error(`第 ${pageNumber} 页生成失败`));
      }
    }, 'image/png');
  });
}

function pageFilename(index) {
  return `xiaohongshu-page-${String(index + 1).padStart(2, '0')}.png`;
}

export async function exportCanvasesToDirectory(
  canvases,
  {
    showDirectoryPicker = globalThis.showDirectoryPicker,
    onProgress = () => {},
  } = {},
) {
  if (typeof showDirectoryPicker !== 'function') {
    throw new Error('当前浏览器不支持批量保存到文件夹');
  }

  const directory = await showDirectoryPicker({
    id: 'graphic-layout-export',
    mode: 'readwrite',
  });
  const total = canvases.length;
  onProgress(0, total);

  for (const [index, canvas] of canvases.entries()) {
    const blob = await canvasToPngBlob(canvas, index + 1);
    const filename = pageFilename(index);
    const fileHandle = await directory.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    onProgress(index + 1, total);
  }

  return {
    count: total,
    directory,
  };
}
