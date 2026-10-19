FROM gitea/act_runner:0.4.1

RUN apk update && \
    apk add --no-cache \
        nodejs npm git docker-cli docker-cli-compose \
        python3 py3-pip curl libc6-compat && \
    mkdir -p /usr/local/lib/docker/cli-plugins && \
    ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/lib/docker/cli-plugins/docker-compose

RUN python3 -m venv /opt/poetry && \
    /opt/poetry/bin/pip install --upgrade pip && \
    /opt/poetry/bin/pip install poetry

RUN mkdir -p /opt/pact && \
    curl -L https://github.com/pact-foundation/pact-ruby-standalone/releases/download/v2.4.1/pact-2.4.1-linux-x86_64.tar.gz | tar -xz -C /opt/pact

ENV PATH="/opt/pact/pact/bin:/opt/poetry/bin:${PATH}"