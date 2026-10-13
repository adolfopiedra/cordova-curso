FROM node:22.20.0-bookworm
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jdk-headless curl unzip git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    GRADLE_HOME=/opt/gradle/gradle-8.7 \
    GRADLE_USER_HOME=/root/.gradle \
    CORDOVA_JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    CORDOVA_TELEMETRY_OFF=1 \
    CI=1
ENV PATH="${JAVA_HOME}/bin:${GRADLE_HOME}/bin:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:/opt/cordova-cli/node_modules/.bin:${PATH}"
RUN curl -fL --retry 3 https://services.gradle.org/distributions/gradle-8.7-bin.zip -o /tmp/gradle.zip \
    && echo '544c35d6bd849ae8a5ed0bcea39ba677dc40f49df7d1835561582da2009b961d  /tmp/gradle.zip' | sha256sum -c - \
    && unzip -q /tmp/gradle.zip -d /opt/gradle && rm /tmp/gradle.zip
# Pinned command-line tools, compatible with Java 17.
RUN curl -fL --retry 3 https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip -o /tmp/sdk.zip \
    && mkdir -p "${ANDROID_HOME}/cmdline-tools" \
    && unzip -q /tmp/sdk.zip -d /tmp/android-tools \
    && mv /tmp/android-tools/cmdline-tools "${ANDROID_HOME}/cmdline-tools/latest" \
    && rm -rf /tmp/sdk.zip /tmp/android-tools
# Building this image accepts the Android SDK licences (see README).
# Disable pipefail only for yes: sdkmanager closing stdin gives yes SIGPIPE.
RUN set +o pipefail; yes | sdkmanager --licenses > /dev/null
RUN sdkmanager "platform-tools" "platforms;android-34" "platforms;android-33" \
    "platforms;android-29" "sources;android-33" "sources;android-29" \
    "platforms;android-35" "platforms;android-36" \
    "build-tools;34.0.0" "build-tools;33.0.2" "build-tools;35.0.0" "build-tools;36.0.0"
# Fail during image construction if SDK 36 or its build tools are missing.
RUN test -f "${ANDROID_HOME}/platforms/android-36/android.jar" \
    && test -x "${ANDROID_HOME}/build-tools/36.0.0/aapt2"
WORKDIR /opt/cordova-cli
COPY tooling/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && cordova telemetry off
WORKDIR /workspace
CMD ["sleep", "infinity"]
