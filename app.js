'use strict';

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

function main() {
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    premultipliedAlpha: false
  });
  /**
   * 캔버스를 투명하게 만드는 방법
   * 
   * three.js는 캔버스를 기본적으로 불투명 렌더링 처리함.
   * 얘를 투명하게 만들 수 있도록 설정을 해주려면 WebGLRenderer를 생성할 때
   * 1. alpha값을 true로 할당해주고,
   * 2. premultipliedAlpha값은 false로 할당해줘야 함.
   * 아렇게 하면 캔버스를 투명하게 만들 수 있는 준비가 된 상태인거임.
   * 
   * alpha값은 캔버스에 알파 버퍼를 포함시킬지를 결정하는건데
   * premultipliedAlpha값은 뭘까?
   * 
   * rgba로 색상값을 나타내는 알파 형식에는 총 두 가지가 있음.
   * 1. Non-premultiplied alpha(straight alpha)
   * 얘는 rgba값을 나타낼 때, r, g, b는 alpha값이 아직 곱해지지 않은, 즉 순수한 r, g, b값만이 들어있고,
   * 화면에 얘를 출력할 때, r, g, b 각각에 a값만큼 투명도 퍼센트를 곱해서 표현해 줌.
   * 
   * 2. Premultiplied alpha(associated alpha)
   * 반면 얘는 rgba값을 나타낼 때 r, g, b는 미리 alpha값이 곱해져있는 값이 할당되어있는 상태임.
   * 그니까 여기서의 a값은 사실상 아무 의미가 없음. 덤으로 얹어주는 값이고, 그냥 'r, g, b각각에 a값만큼 투명도를 곱했으니 참고해~' 요정도의 의미.
   * 
   * 그래서 보통 three.js에서 캔버스는 투명도를 조절하지 않는것을 기본 전제로 하기 때문에
   * premultipliedAlpha값은 true가 됨. true가 되면 여기에 들어있는 알파값은 아무 의미가 없는 덤으로 얹어주는 값이 되어버리니까!
   * 
   * 근데 material 객체는 premultipliedAlpha값이 false가 기본임. 왜냐?
   * material은 opacity값을 할당하여 알파값으로 색상의 투명도를 조절할 수 있는, 즉 의미있는 값이 되도록 해야하니까!
   * 
   * 근데 여기서는 캔버스를 투명하게 만들고 싶은거니까 WebGLRenderer의 premultipliedAlpha값을 false로 해줘서
   * 알파값을 받아들일 준비를 해놓는거지.
   */

  const fov = 75;
  const aspect = 2 // 캔버스의 가로 / 세로 비율. 캔버스의 기본 크기가 300 * 150이므로 캔버스 기본 비율과 동일하게 설정한 셈.
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  camera.position.z = 2;

  const scene = new THREE.Scene();

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({
      color,
      opacity: 0.5 // WebGLRenderer의 캔버스가 투명도를 받아들일 수 있게 세팅을 해놨으니 퐁-머티리얼의 투명도값을 주면 렌더링 시 반영되겠지
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;

    return cube;
  }

  const cubes = [
    makeInstance(geometry, 0x44aa88, 0),
    makeInstance(geometry, 0x8844aa, -2),
    makeInstance(geometry, 0xaa8844, 2),
  ];

  /**
   * three.js에서 레티나 디스플레이를 다루는 방법
   * (공식 문서에는 HD-DPI를 다루는 법이라고 나와있음.)
   * 
   * renderer.setPixelRatio(window.devicePixelRatio);
   * 
   * 위에 메소드를 사용해서 캔버스의 픽셀 사이즈를 CSS 사이즈에 맟출수도 있지만, 
   * 공식 문서에서는 추천하지 않는다고 함.
   * 
   * 그냥 아래와 같이 pixelRatio값을 직접 구한 뒤에 clientWidth,Height에 곱해주는 게 훨씬 낫다고 함.
   * 원래 2d canvas에 할때도 이렇게 했으니 하던대로 하면 될 듯.
   * 
   * 자세한 내용은 공식 문서 참고...
   */
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = canvas.clientWidth * pixelRatio | 0;
    const height = canvas.clientHeight * pixelRatio | 0;

    const needResize = canvas.width !== width || canvas.height !== height;

    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  function animate(t) {
    // 타임스탬프 값이 16.~~ms 이런식으로 밀리세컨드 단위로 리턴받는거를 0.016~~s의 세컨드 단위로 변환하려는 거.
    // 이제 매 프레임마다 갱신되는 세컨드 단위의 타임스탬프 값만큼 해당 mesh의 x축과 y축을 회전시키겠다는 거임.
    t *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    cubes.forEach((cube, index) => {
      const speed = 1 + index * 0.1;
      const rotate = t * speed;
      cube.rotation.x = rotate;
      cube.rotation.y = rotate;
    });

    renderer.render(scene, camera);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

main();