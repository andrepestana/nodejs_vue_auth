<template>
    <div>
        <div class="alert alert-danger" role="alert" v-if="validationMessages.length">
            <p class="font-weight-bold">Please check the validation messages before continuing:</p>
            <ul class="list-unstyled ml-2">
                <li v-for="(message,index) in validationMessages" :key="index">
                    {{ message.message }}
                </li>
            </ul>
        </div>
        <div class="alert alert-warning" role="alert" v-if="otherMessages.length">
            <ul class="list-unstyled">
                <li v-for="(message,index) in otherMessages" :key="index">
                    {{ message.message }}
                </li>
            </ul>
        </div>
        <div class="alert alert-success" role="alert" v-if="successMessages.length">
            <ul class="list-unstyled">
                <li v-for="(message,index) in successMessages" :key="index">
                    {{ message.message }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
export default {
    computed: {
        otherMessages() {
            if(!this.$store.getters.messages) {
                return []
            }
            return this.$store.getters.messages.filter((m) => m.category !== 'validationMessage' && m.category !== 'successMessage')
        },
        validationMessages() {
            if(!this.$store.getters.messages) {
                return []
            }
            return this.$store.getters.messages.filter((m) => m.category === 'validationMessage')
        },
        successMessages() {
            if(!this.$store.getters.messages) {
                return []
            }
            return this.$store.getters.messages.filter((m) => m.category === 'successMessage')
        }
    }
}
</script>

