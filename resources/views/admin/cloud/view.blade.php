@include('include.header')



	 <section class="section">
		 <div class="container" id="app">
		 


		 
		 
@if (isset($cloud->id))
	<form method="POST" enctype="multipart/form-data" action="{{route('cloud-update')}}">
    @csrf
	 @method('PUT')
	 <input type="hidden" name="id" value="{{$cloud->id}}">
	@else 
	 <form method="POST"  enctype="multipart/form-data" action="{{route('cloud-create')}}">
    @csrf
	 
	@endif
<h1 class="title">Cloud configuration</h1>

<div class="field">
    <label class="label">Choose cloud type</label>
    <div class="control">
      <div class="select">
        <select name="type" @change="onChange($event)" >
		@isset($cloud)
			@if($cloud->type=='google')
			<option value="google" selected>Google</option>
			@else
			<option value="google">Google</option>
			@endif
		
		@else
			<option disabled selected value> -- select an option -- </option>
			<option value="google">Google</option>
		@endif
			
        </select>
      </div>
    </div>
</div>



  <template v-if="template === 'google'">
  
  @csrf



<div class="field">
  <label class="label">Project name</label>
  <div class="control">
  
    @isset($cloud)
<input class="input" type="text" name="project" value="{{$cloud->project}}">
@else
<input class="input" type="text" name="project" value="">
@endif
  
  
	
  </div>
</div>


<div class="field">
  <label class="label">Default machine type</label>
  <div class="control">
  
    @isset($cloud)
	<input class="input" type="text" name="machine" value="{{$cloud->machine}}">
@else
<input class="input" type="text" name="machine" value="">
@endif

  </div>
</div>




<div class="field">
  <label class="label">Zone</label>
  <div class="control">
  
    @isset($cloud)
<input class="input" type="text" name="zone" value="{{$cloud->zone}}">
@else
<input class="input" type="text" name="zone" value="">
@endif

  </div>
</div>



<div class="field">
  <label class="label">Network</label>
  <div class="control">
  
  
  @isset($cloud)
<input class="input" type="text" name="network" value="{{$cloud->network}}">
@else
<input class="input" type="text" name="network" value="">
@endif

  </div>
</div>


  <div class="field">
  <div class="control">
@isset($cloud)
<label class="label">{{$cloud->keyfile}}</label><br/>
@else
<label class="label">No key file</label>
@endif
  </div>
</div>


  <div class="field">
  <div class="control">
<div class="file has-name">


  <label class="file-label">
 
    <input class="file-input" type="file" name="keyfile">
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label">
         JSON config file
      </span>
    </span>
    <span class="file-name">
     
    </span>
  </label>
</div>
  </div>
</div>


  
  </template>

















<br/>
<div class="field">
  <div class="control">
    <button class="button is-success">Save</button>
  </div>
</div>
</form>


    </div>

    </section>

<script>
var app = new Vue({
  el: '#app',
  data: {
	  @isset($cloud)
			@if($cloud->type=='google')
			template:"google"
			@endif
		
		@else
			template:""
		@endif
    
  },
  methods: {
    onChange(event) {
            this.template=event.target.value;
        }
    }
  
  
})
</script>

@include('include.footer')