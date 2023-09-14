module.exports = {
  hooks: {
    readPackage: (pkg) => {
      if (pkg.name === 'readable-stream') {
        pkg.dependencies['buffer'] = '6.0.3';
      }
      if (pkg.name === 'floggy') {
        pkg.dependencies['chalk'] = '^4.1.2';
      }
      return pkg;
    }
  }
};
