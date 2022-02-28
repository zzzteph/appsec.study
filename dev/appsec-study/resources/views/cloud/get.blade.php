@include('include.header')



	 <section class="section">
		 <div class="container">
		 


		 
		 
@if (isset($cloud->id))
	<form method="POST" action="{{route('update-cloud')}}">
    @csrf
	 @method('PUT')
	 <input type="hidden" name="id" value="{{$cloud->id}}">
	@else 
	 <form method="POST"  action="{{route('create-cloud')}}">
    @csrf
	 
	@endif
<h1 class="title">General cloud configuration</h1>
<div class="field">
  <label class="label">Name</label>
  <div class="control">
	@if (isset($cloud->name))
  
	
		<input class="input" type="text" name="name" value="{{$cloud->name}}">
	
	@else
		<input class="input" type="text" placeholder="cloud name" name="name" value="">
	@endif
	
  </div>
</div>
<hr/>
<h1 class="title">Cloud configuration</h1>

<div class="field">
  <label class="label">Service Account Id</label>
  <div class="control">
	@if (isset($cloud->service_account_id))
  
	
		<input class="input" type="text" name="service_account_id" value="{{$cloud->service_account_id}}">
	
	@else
		<input class="input" type="text" placeholder="Service Account Id" name="service_account_id" value="">
	@endif
	
  </div>
</div>




<div class="field">
  <label class="label">Key Id</label>
  <div class="control">
	@if (isset($cloud->key_id))
  
	
		<input class="input" type="text" name="key_id" value="{{$cloud->key_id}}">
	
	@else
		<input class="input" type="text" placeholder="Key ID" name="key_id" value="">
	@endif
	
  </div>
</div>






<div class="field">
  <label class="label">Folder Id</label>
  <div class="control">
	@if (isset($cloud->folder_id))
  
	
		<input class="input" type="text" name="folder_id" value="{{$cloud->folder_id}}">
	
	@else
		<input class="input" type="text" placeholder="Folder ID" name="folder_id" value="">
	@endif
	
  </div>
</div>


<div class="field">
  <label class="label">Subnet Id</label>
  <div class="control">
	@if (isset($cloud->subnet_id))
  
	
		<input class="input" type="text" name="subnet_id" value="{{$cloud->subnet_id}}">
	
	@else
		<input class="input" type="text" placeholder="Subnet ID" name="subnet_id" value="">
	@endif
	
  </div>
</div>

<div class="field">
  <label class="label">Platform Id</label>
  <div class="control">
	@if (isset($cloud->platform_id))
  
	
		<input class="input" type="text" name="platform_id" value="{{$cloud->platform_id}}">
	
	@else
		<input class="input" type="text" placeholder="Platform ID" name="platform_id" value="">
	@endif
	
  </div>
</div>



<div class="field">
  <label class="label">Zone Id</label>
  <div class="control">
	@if (isset($cloud->zone_id))
  
	
		<input class="input" type="text" name="zone_id" value="{{$cloud->zone_id}}">
	
	@else
		<input class="input" type="text" placeholder="Zone ID" name="zone_id" value="">
	@endif
	
  </div>
</div>


<hr/>
<h1 class="title">VMS limits</h1>
<div class="field">
  <label class="label">VMS Max</label>
  <div class="control">
	@if (isset($cloud->vms_count))
  
	
		<input class="input" type="text" name="vms_count" value="{{$cloud->vms_count}}">
	
	@else
		<input class="input" type="text" placeholder="VMS Count" name="vms_count" value="">
	@endif
	
  </div>
</div>


<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>


    </div>

    </section>



@include('include.footer')