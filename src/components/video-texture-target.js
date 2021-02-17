import { disposeTexture } from "../utils/material-utils";
import { createVideoOrAudioEl } from "../utils/media-utils";

/**
 * @component video-texture-target
 * This compoennt is intended to be used on entities with a mesh/skinned mesh Object3D
 * The component swaps the base color map on the mesh's material with a video texture
 * Currently the video texture can only be a Webcam stream, but this component could be easily modified
 * to work with normal urls, screensharing, etc.
 */
AFRAME.registerComponent("video-texture-target", {
  schema: {
    src: { type: "string" }
  },

  getMaterial() {
    return (
      (this.el.object3DMap.skinnedmesh && this.el.object3DMap.skinnedmesh.material) ||
      (this.el.object3DMap.mesh && this.el.object3DMap.mesh.material) ||
      this.el.object3D.material
    );
  },

  init() {
    const material = this.getMaterial();

    if (!material) {
      console.warn("video-texture-target added to an entity without a material");
    }

    this.originalTexture = material && material.map;
  },

  update(prevData) {
    const material = this.getMaterial();

    if (!material) {
      return;
    }

    const src = this.data.src;

    if (prevData.src === src) {
      return;
    }

    if (src && src.startsWith("hubs://")) {
      const streamClientId = src.substring(7).split("/")[1]; // /clients/<client id>/video is only URL for now

      NAF.connection.adapter.getMediaStream(streamClientId, "video").then(stream => {
        if (src !== this.data.src) {
          // Prevent creating and loading video texture if the src changed while we were fetching the video stream.
          return;
        }

        const video = createVideoOrAudioEl("video");
        video.srcObject = stream;

        const texture = new THREE.VideoTexture(video);
        texture.flipY = false;
        texture.minFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;

        material.map = texture;
        material.needsUpdate = true;
      });
    } else {
      if (material.map && material.map !== this.originalTexture) {
        disposeTexture(material.map);
      }

      material.map = this.originalTexture;
      material.needsUpdate = true;
    }
  },

  remove() {
    const material = this.getMaterial();

    if (material && material.map && material.map !== this.originalTexture) {
      disposeTexture(material.map);
    }
  }
});
