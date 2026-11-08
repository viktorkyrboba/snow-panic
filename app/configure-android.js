// Runs after `npx cap add android`: signing, version, icons, portrait+landscape, billing permission.
const fs = require('fs'), path = require('path');
const A = path.join(__dirname, 'android');
const gradle = path.join(A, 'app', 'build.gradle');
let g = fs.readFileSync(gradle, 'utf8');
if (!g.includes('// snow-panic signing')) {
  g += `
// snow-panic signing + version
def spProps = new Properties()
def spFile = rootProject.file('../signing.properties')
if (spFile.exists()) { spFile.withInputStream { spProps.load(it) } }
android {
    defaultConfig {
        versionCode Integer.parseInt(System.getenv('VERSION_CODE') ?: '1')
        versionName System.getenv('VERSION_NAME') ?: '1.0.0'
    }
    signingConfigs {
        release {
            storeFile rootProject.file('../' + (spProps['storeFile'] ?: 'upload.jks'))
            storePassword spProps['storePassword']
            keyAlias spProps['keyAlias']
            keyPassword spProps['keyPassword']
        }
    }
    buildTypes { release { signingConfig signingConfigs.release; minifyEnabled false } }
}
`;
  fs.writeFileSync(gradle, g);
}
// Billing permission (the plugin also declares it; harmless to ensure).
const man = path.join(A, 'app', 'src', 'main', 'AndroidManifest.xml');
let m = fs.readFileSync(man, 'utf8');
if (!m.includes('com.android.vending.BILLING')) m = m.replace('<application', '<uses-permission android:name="com.android.vending.BILLING" />\n    <application');
// Full screen game: hide the title bar, keep the screen on handled by the web game.
fs.writeFileSync(man, m);
// Icons
const res = path.join(A, 'app', 'src', 'main', 'res');
for (const d of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  const dir = path.join(res, 'mipmap-' + d);
  if (!fs.existsSync(dir)) continue;
  for (const n of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
    const src = path.join(__dirname, 'icons', `${n}-${d}.png`);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, n + '.png'));
  }
}
const bg = path.join(res, 'values', 'ic_launcher_background.xml');
if (fs.existsSync(bg)) fs.writeFileSync(bg, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#4F8FD8</color>\n</resources>\n');
console.log('android configured');
