FROM debian:12

RUN touch /root/.bashrc

RUN apt-get update \
    && apt-get install -y \
        curl \
	git \
        gnupg2 \
        lsb-release \
	wget \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

RUN apt-get install -y nodejs

RUN wget -qO- https://get.pnpm.io/install.sh | PNPM_VERSION=7.14.1  ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

WORKDIR /app

COPY . /app

RUN bash -l -c "pnpm install && cd compiler && pnpm build"

# Neither build nor serve worked. Not sure if thats my fault.
CMD ["bash", "-l", "-c", "cd website && pnpm dev --host"]

