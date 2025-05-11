/// <reference types="@webgpu/types" />

// deno ./dl/convolution-example.ts

export {};

/*
 * Naive convolution of two Float32Array vectors using WebGPU
 * Both inputs have length N, output has length 2*N - 1
 */
async function runConvolution(aArray: Float32Array<ArrayBuffer>, bArray: Float32Array<ArrayBuffer>): Promise<Float32Array<ArrayBuffer>> {
  if (!navigator.gpu) {
    throw new Error('WebGPU not supported. Please enable WebGPU in your browser.');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('No GPU adapter found. Please check your GPU settings.');
  }
  const device = await adapter.requestDevice();
  device.addEventListener('uncapturederror', (event) => {
    console.error(event.error);
  });

  const N = aArray.length;
  const outLength = 2 * N - 1;

  // Create GPU buffers
  const aBuffer = device.createBuffer({
    size: aArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const bBuffer = device.createBuffer({
    size: bArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const resultBuffer = device.createBuffer({
    size: outLength * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const stagingBuffer = device.createBuffer({
    size: outLength * 4,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });

  // Upload data to GPU
  device.queue.writeBuffer(aBuffer, 0, aArray.buffer, aArray.byteOffset, aArray.byteLength);
  device.queue.writeBuffer(bBuffer, 0, bArray.buffer, bArray.byteOffset, bArray.byteLength);

  // WGSL compute shader
  const shaderCode = `
struct Array {
  data: array<f32>,
};

@group(0) @binding(0) var<storage, read> a : Array;
@group(0) @binding(1) var<storage, read> b : Array;
@group(0) @binding(2) var<storage, read_write> result : Array;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let i = gid.x;
  if (i >= ${outLength}u) {
    return;
  }
  var sum: f32 = 0.0;
  let N = ${N}u;
  // naive convolution: sum_{j=0..N-1, k=0..N-1, j+k=i}
  for (var j: u32 = 0u; j < N; j = j + 1u) {
    let k = i - j;
    if (k < N) {
      sum = sum + a.data[j] * b.data[k];
    }
  }
  result.data[i] = sum;
}`;

  // Create pipeline
  const shaderModule = device.createShaderModule({ code: shaderCode });
  if (shaderModule.getCompilationInfo) {
    const compilationInfo = await shaderModule.getCompilationInfo();
    const compilationErrors = compilationInfo.messages.filter((message) => message.type === 'error').map((message) =>
      new SyntaxError(`Shader compilation error: ${message.lineNum}:${message.linePos}: ${message.message}`)
    );
    if (compilationErrors.length > 1) {
      throw new AggregateError(compilationErrors, 'Shader compilation errors');
    } else if (compilationErrors.length > 0) {
      throw compilationErrors[0];
    }
    for (const message of compilationInfo.messages) {
      console.warn(
        new SyntaxError(`Shader compilation warning: ${message.lineNum}:${message.linePos}: ${message.message}`)
      );
    }
  } else {
    console.warn("No getCompilationInfo API found");
  }
  console.log("shaderModule", shaderModule);
  const pipeline = await device.createComputePipelineAsync({
    compute: { module: shaderModule, entryPoint: 'main' },
    layout: "auto"
  });

  // Bind group
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: aBuffer } },
      { binding: 1, resource: { buffer: bBuffer } },
      { binding: 2, resource: { buffer: resultBuffer } }
    ]
  });

  // Command encoder
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  // Dispatch enough workgroups to cover outLength
  const workgroupSize = 64;
  const dispatchCount = Math.ceil(outLength / workgroupSize);
  passEncoder.dispatchWorkgroups(dispatchCount);
  passEncoder.end();

  // Copy result to staging buffer
  commandEncoder.copyBufferToBuffer(resultBuffer, 0, stagingBuffer, 0, outLength * 4);

  // Submit commands
  device.queue.submit([commandEncoder.finish()]);

  // Read back
  await stagingBuffer.mapAsync(GPUMapMode.READ);
  const copyArrayBuffer = stagingBuffer.getMappedRange();
  const resultArray = new Float32Array(copyArrayBuffer.slice(0));
  stagingBuffer.unmap();

  return resultArray;
}

// Example usage
(async () => {
  const N = 8;
  // Sample data
  const a = new Float32Array(Array.from({ length: N }, (_, i) => i + 1));
  const b = new Float32Array(Array.from({ length: N }, (_, i) => (i + 1) * 2));
  const conv = await runConvolution(a, b);
  console.log('Convolution result:', conv);
})();
