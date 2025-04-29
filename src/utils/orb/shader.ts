export const vert = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
    }
`;

export const frag = /* glsl */ `
    precision highp float;

    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float hover;
    uniform float rot;
    uniform float hoverIntensity;
    varying vec2 vUv;

    // 优化 1: 预计算固定值
    const float PI = 3.14159265;
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
    const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
    const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
    const float innerRadius = 0.6;
    const float noiseScale = 0.65;
    
    // 优化 2: 简化颜色转换函数，避免重复计算
    vec3 adjustHue(vec3 color, float hueDeg) {
      float hueRad = hueDeg * PI / 180.0;
      float cosA = cos(hueRad);
      float sinA = sin(hueRad);
      
      // 直接计算 YIQ 转换并返回 RGB，避免多次转换
      float y = dot(color, vec3(0.299, 0.587, 0.114));
      float i = dot(color, vec3(0.596, -0.274, -0.322));
      float q = dot(color, vec3(0.211, -0.523, 0.312));
      
      float i2 = i * cosA - q * sinA;
      float q2 = i * sinA + q * cosA;
      
      float r = y + 0.956 * i2 + 0.621 * q2;
      float g = y - 0.272 * i2 - 0.647 * q2;
      float b = y - 1.106 * i2 + 1.703 * q2;
      
      return vec3(r, g, b);
    }
    
    // 优化 3: 简化噪声函数，保持视觉效果但减少计算量
    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
      p3 += dot(p3, p3.yxz + 19.19);
      return -1.0 + 2.0 * fract(vec3(
        p3.x + p3.y,
        p3.x + p3.z,
        p3.y + p3.z
      ) * p3.zyx);
    }
    
    // 优化 4: 优化 snoise3 函数，减少重复计算并提前退出
    float snoise3(vec3 p) {
      vec3 i = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      
      // 使用 min/max 进行分支优化
      vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      
      // 计算距离的平方，避免重复计算
      float d0d0 = dot(d0, d0);
      float d1d1 = dot(d1, d1);
      float d2d2 = dot(d2, d2);
      float d3d3 = dot(d3, d3);
      
      // 早期退出：如果所有点都远离，返回0
      if (d0d0 > 1.0 && d1d1 > 1.0 && d2d2 > 1.0 && d3d3 > 1.0) {
        return 0.0;
      }
      
      vec4 h = max(0.6 - vec4(d0d0, d1d1, d2d2, d3d3), 0.0);
      vec4 n = h * h * h * h * vec4(
        dot(d0, hash33(i)),
        dot(d1, hash33(i + i1)),
        dot(d2, hash33(i + i2)),
        dot(d3, hash33(i + 1.0))
      );
      
      return dot(vec4(31.316), n);
    }
    
    // 优化 5: 内联简单函数以减少函数调用开销
    float light1(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * attenuation);
    }
    
    float light2(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * dist * attenuation);
    }
    
    vec4 extractAlpha(vec3 colorIn) {
      float a = max(max(colorIn.r, colorIn.g), colorIn.b);
      return vec4(colorIn.rgb / (a + 1e-5), a);
    }
    
    vec4 draw(vec2 uv) {
      // 预计算一些重复使用的值
      vec3 color1 = adjustHue(baseColor1, hue);
      vec3 color2 = adjustHue(baseColor2, hue);
      vec3 color3 = adjustHue(baseColor3, hue);
      
      float len = length(uv);
      
      // 提前退出：如果点远离中心，直接返回透明
      if (len > 1.2) {
        return vec4(0.0, 0.0, 0.0, 0.0);
      }
      
      float ang = atan(uv.y, uv.x);
      float invLen = len > 0.0 ? 1.0 / len : 0.0;
      
      // 减少噪声质量/复杂度在不明显的区域
      float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
      float r0 = mix(innerRadius, 1.0, mix(0.4, 0.6, n0));
      float d0 = distance(uv, (r0 * invLen) * uv);
      
      // 内联 light1 调用
      float v0 = 1.0 / (1.0 + d0 * 10.0);
      v0 *= smoothstep(r0 * 1.05, r0, len);
      
      float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
      float a = iTime * -1.0;
      vec2 pos = vec2(cos(a), sin(a)) * r0;
      float d = distance(uv, pos);
      
      // 内联 light1 和 light2 调用
      float v1 = 1.5 / (1.0 + d * d * 5.0);
      v1 *= 1.0 / (1.0 + d0 * 50.0);
      
      float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
      float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
      
      vec3 col = mix(color1, color2, cl);
      col = mix(color3, col, v0);
      col = (col + v1) * v2 * v3;
      col = clamp(col, 0.0, 1.0);
      
      return extractAlpha(col);
    }
    
    vec4 mainImage(vec2 fragCoord) {
      vec2 center = iResolution.xy * 0.5;
      float size = min(iResolution.x, iResolution.y);
      vec2 uv = (fragCoord - center) / size * 2.0;
      
      // 旋转代码优化：预计算 sin/cos
      float s = sin(rot);
      float c = cos(rot);
      vec2 rotUv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
      
      // 悬停效果优化：如果悬停值很小，跳过计算
      if (hover * hoverIntensity > 0.001) {
        rotUv.x += hover * hoverIntensity * 0.1 * sin(rotUv.y * 10.0 + iTime);
        rotUv.y += hover * hoverIntensity * 0.1 * sin(rotUv.x * 10.0 + iTime);
      }
      
      return draw(rotUv);
    }
    
    void main() {
      vec2 fragCoord = vUv * iResolution.xy;
      vec4 col = mainImage(fragCoord);
      gl_FragColor = vec4(col.rgb * col.a, col.a);
    }
`;